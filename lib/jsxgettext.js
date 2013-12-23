/* jshint node: true, undef: true */
/* global module, require */
"use strict";

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs   = require('fs');
var path = require('path');

var parser     = require('esprima');
var escodegen  = require('escodegen');
var estraverse = require('estraverse');
var jade       = require('jade');

var generate = escodegen.generate;
var traverse = estraverse.traverse;

var gettextParser = require('gettext-parser');


function isStringLiteral(node) {
  return node.type === 'Literal' && (typeof node.value === 'string');
}

function isStrConcatExpr(node) {
  var left = node.left;
  var right = node.right;

  return node.type === "BinaryExpression" && node.operator === '+' && (
      (isStringLiteral(left) || isStrConcatExpr(left)) &&
      (isStringLiteral(right) || isStrConcatExpr(right))
  );
}

function checkExpr(node, keyword) {
  var firstArg = node.arguments && node.arguments[0];
  return (node.type === "CallExpression" &&   // must be a call expression
            (
              node.callee.name &&  // Should not be an anonymous function call
              (node.callee.name === 'gettext' ||            // with a gettext call expr
              (node.callee.name === keyword)) ||            // or keyword call expr
              (node.callee.type === 'MemberExpression' &&   // or a member expr
              (node.callee.property.name === 'gettext' ||
               node.callee.property.name === keyword))
            ) &&
    firstArg && (isStrConcatExpr(firstArg) || isStringLiteral(firstArg))
  );
}

// Assumes node is either a string Literal or a strConcatExpression
function extractStr(node) {
  if (isStringLiteral(node))
    return node.value;
  else
    return extractStr(node.left) + extractStr(node.right);
}

// generate extracted strings file
function gen (sources, options) {
  var poJSON;
  if (options['join-existing'])
    poJSON = loadStrings(path.resolve(path.join(options['output-dir'] || '', options.output)));

  if (!poJSON)
    poJSON = {
      charset: "utf-8",
      headers: {
        "project-id-version": "PACKAGE VERSION",
        "language-team": "LANGUAGE <LL@li.org>",
        "po-revision-date": "YEAR-MO-DA HO:MI+ZONE",
        "language": "",
        "mime-version": "1.0",
        "content-transfer-encoding": "8bit"
      },
      translations: {'': {} }
    };

  poJSON.headers["pot-creation-date"] = new Date().toISOString().replace('T', ' ').replace(/:\d{2}.\d{3}Z/, '+0000');

  // Always use the default context for now
  // TODO: Take into account different contexts
  var translations = poJSON.translations[''];

  Object.keys(sources).forEach(function (filename) {
    var source = sources[filename].replace(/^#.*/, ''); // strip leading hash-bang
    var ast    = parser.parse(source, {comment: true, tokens: true, loc: true, range: true});

    function lineFromRange (range) {
      return source.slice(0, range[1]).split('\n').length;
    }

    // finds comments that end on the previous line
    function findComments (comments, line) {
      return comments.map(function (node) {
        var commentLine = lineFromRange(node.range);
        if (node.value.match(/^\s*L10n:/) &&
          (commentLine == line || commentLine + 1 == line)) {
          return node.value.replace(/^\s*L10n:/, '');
        }
      }).filter(Boolean).join('\n');
    }

    traverse(ast, {
      cursor: 0,
      enter: function (node) {
        if (!checkExpr(node, options.keyword))
          return;

        var str = extractStr(node.arguments[0]);
        var line = node.loc.start.line;
        var comments = findComments(ast.comments, line);

        var ref = filename + ':' + line;
        if (!translations[str]) {
          translations[str] = {
            msgid: str,
            msgstr: [],
            comments: {
              translator: comments,
              reference: ref
            }
          };
        } else {
          translations[str].comments.reference +=  '\n' + ref;
          if (comments)
            translations[str].comments.translator += '\n' + comments;
        }
      }
    });


    function dedupeNCoalesce(item, i, arr) {
      return item && arr.indexOf(item) === i;
    }

    Object.keys(translations).forEach(function (msgid) {
      var comments = translations[msgid].comments;

      if (!comments)
        return;

      if (comments.reference)
        comments.reference = comments.reference.split('\n').filter(dedupeNCoalesce).join('\n');
      if (comments.translator)
        comments.translator = comments.translator.split('\n').filter(dedupeNCoalesce).join('\n');
    });
  });

  return gettextParser.po.compile(poJSON).toString();
}

// generate extracted strings file from EJS
function genEJS (ejsSources, options) {
  Object.keys(ejsSources).forEach(function (filename) {
    ejsSources[filename] = parseEJS(ejsSources[filename]);
  });

  return gen(ejsSources, options);
}

// generate extracted strings file from Jade templates
function genJade (jadeSources, options) {
  Object.keys(jadeSources).forEach(function (filename) {
    jadeSources[filename] = parseJade(jadeSources[filename], options);
  });
  return gen(jadeSources, options);
}


// generate extracted strings file from Handlebars/Mustache templates
function genHandlebars (hbSources, options) {
  Object.keys(hbSources).forEach(function (filename) {
    hbSources[filename] = parseHandlebars(hbSources[filename]);
  });
  return gen(hbSources, options);
}

// generate extracted strings file from Jinja2 templates
function genJinja (jinjaSources, options) {
  Object.keys(jinjaSources).forEach(function (filename) {
      jinjaSources[filename] = parseEJS(jinjaSources[filename], {open: "{{", close: "}}"});
  });

  return gen(jinjaSources, options);
}

function loadStrings (poFile) {
  try {
    return gettextParser.po.parse(fs.readFileSync(path.resolve(poFile)), "utf-8");
  } catch (e) {
    return null;
  }
}

// strips everything but the javascript bits
function parseEJS (str, options){
  options = options || {};
  var open = options.open || '<%',
    close = options.close || '%>';

  var buf = [];
  var lineno = 1;

  for (var i = 0, len = str.length; i < len; ++i) {
    if (str.slice(i, open.length + i) == open) {
      i += open.length;
      switch (str.substr(i, 1)) {
        case '=':
        case '-':
          ++i;
          break;
      }

      var end = str.indexOf(close, i), js = str.substring(i, end), start = i, n = 0;
      if ('-' == js[js.length-1]){
        js = js.substring(0, js.length - 2);
      }
      /* jshint -W030 */
      while (~(n = js.indexOf("\n", n))) n++,buf.push("\n");
      /* jshint +W030 */
      // skip EJS include statements which are not valid javascript
      if (/^\s*include\s*[^\s]+\s*$/.test(js)) js = "";
      buf.push(js, ';');
      i += end - start + close.length - 1;

    } else if (str.substr(i, 1) == "\n") {
        buf.push("\n");
    }
  }

  return buf.join('');
}

// From MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegExp(string){
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function parseJade(str, options) {
  options = options || {};

  var lineno = 1;

  var parser = new jade.Parser(str);
  var lexer = parser.lexer;
  var token;

  var gettextRegexPrefix = '(?:gettext';
  if (options.keyword) {
    gettextRegexPrefix += '|' + escapeRegExp(options.keyword);
  }
  gettextRegexPrefix += ')';
  var gettexRegex = new RegExp(gettextRegexPrefix + '(?:\\(\"[^"]+\"|\\(\'[^\']+\')', 'gi');

  function extractGettext(str) {
    if (typeof(str) !== 'string') return '';

    var tmp = str.match(gettexRegex) || [];
    return tmp.map(function(t) {
      return t + ')';
    }).join(';');
  }

  function extractFromObj(key) {
    /* jshint -W040 */
    return extractGettext(this[key]);
  }

  function isEmpty(obj) {
    return obj.length;
  }

  var buf = [], lineN, tmp;
  do {
    token = lexer.next();
    lineN = token.line - 1;
    switch(token.type) {
      case 'attrs':
        tmp = Object.keys(token.attrs).map(extractFromObj, token.attrs).filter(isEmpty);
        if(tmp.length) buf[lineN] = tmp.join('') + ';';
        break;
      case 'text':
      case 'code':
        tmp = extractGettext(token.val);
        if (tmp.length) buf[lineN] = tmp + ';';
        break;
    }
  } while(token.type != 'eos');

  return buf.join('\n');
}

// Turn handlebars helper calls into javascript-syntax functions.
// Also comment blocks are turned into javascript comments.
function parseHandlebars(str, options) {

  // Using regexes for parsing, ooooh yeeeahhh!
  // Short comments:  {{! this is a comment }}
  var shortCommentRE = /\{\{\!(.*?)\}\}/
  // Long comments:  {{!-- this comment has {{markup}} in it --}}
  var longCommentRE = /\{\{\!--(.*?)--\}\}/
  // Block helpers:  {{#helper}}template content{{/helper}}
  var blockHelperStartRE = /\{\{#(\w+)\}\}/
  var blockHelperEndRE = /\{\{\/(\w+)\}\}/
  // Function helpers:  {{ helper value }} or {{ helper "some string" }}
  var singleQuotedStringWithEscapes = "'(([^']*?(\\\\')?)+)'";
  var doubleQuotedStringWithEscapes = '"(([^"]*?(\\\\")?)+)"';
  var funcHelperRE = new RegExp("\\{\\{\\s*(\\w+)\\s+((\\w+)|(" +
                                singleQuotedStringWithEscapes + ")|(" +
                                doubleQuotedStringWithEscapes + "))\\s*\\}\\}")

  var buf = [];
  var match = null;

  while (str.length) {
    // Find the earliest match of any type of tag in the string.
    match = str.match(shortCommentRE);
    if (match) {
      match.type = 'comment';
    }
    var nextMatch = str.match(longCommentRE);
    if (nextMatch) {
      if (!match || nextMatch.index < match.index) {
        match = nextMatch;
        match.type = 'comment';
      }
    }
    nextMatch = str.match(blockHelperStartRE);
    if (nextMatch) {
      if (!match || nextMatch.index < match.index) {
        match = nextMatch;
        match.type = 'block';
      }
    }
    nextMatch = str.match(funcHelperRE);
    if (nextMatch) {
      if (!match || nextMatch.index < match.index) {
        match = nextMatch;
        match.type = 'func';
      }
    }
    if (!match) {
      break;
    }
    str = str.substring(match.index + match[0].length);

    // Translate the match into an appropriate chunk of javascript.
    if (match.type == 'comment') {
      // Template comment => javascript comment
      match[1].split("\n").forEach(function(comment) {
        buf.push("//");
        buf.push(comment);
        buf.push("\n");
      })
    } else if (match.type == 'block') {
      // Template block helper => javascript function call
      var helperName = match[1];
      buf.push(helperName)
      buf.push('("')
      var endMatch = str.match(blockHelperEndRE);
      while (endMatch && endMatch[1] !== helperName) {
        var skipTo = endMatch.index + endMatch[0].length;
        buf.push(str.substring(0, skipTo).replace('"', '\\"'));
        str = str.substring(skipTo);
        endMatch = str.match(blockHelperEndRE);
      }
      if (endMatch) {
        buf.push(str.substring(0, endMatch.index).replace('"', '\\"'));
        str = str.substring(endMatch.index + endMatch[0].length);
      } else {
        buf.push(str.replace('"', '\\"'));
        str = '';
      }
      buf.push('")\n');
    } else if (match.type == 'func') {
      // Template function helper => javascript function call
      buf.push(match[1]);
      buf.push('(');
      buf.push(match[2]);
      buf.push(')\n');
    }
  }

  return buf.join('');
}

exports.generate               = gen;
exports.generateFromEJS        = genEJS;
exports.generateFromJade       = genJade;
exports.generateFromHandlebars = genHandlebars;
exports.generateFromJinja      = genJinja;
