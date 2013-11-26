#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs   = require('fs');
const path = require('path');

const parser     = require('esprima');
const escodegen  = require('escodegen');
const estraverse = require('estraverse');
const jade       = require('jade');

const generate = escodegen.generate;
const traverse = estraverse.traverse;

const gettextParser = require('gettext-parser');


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
              (node.callee.name === keyword))               // or keyword call expr
              ||
              (node.callee.type === 'MemberExpression' &&   // or a member expr
              (node.callee.property.name === 'gettext' ||
               node.callee.property.name === keyword))
            )
            &&
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
    };

    Object.keys(translations).forEach(function (msgid) {
      const comments = translations[msgid].comments;

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

function genJade (jadeSources, options) {
  Object.keys(jadeSources).forEach(function (filename) {
    jadeSources[filename] = parseJade(jadeSources[filename]);
  });
  return gen(jadeSources, options);
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
      while (~(n = js.indexOf("\n", n))) n++,buf.push("\n");
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

function parseJade(str, options) {
  options = options || {};

  var buf = [];
  var lineno = 1;

  var parser = new jade.Parser(str);
  var lexer = parser.lexer;
  var token;

  function extractGettext(str) {
    if (typeof(str) !== 'string') return '';
    var tmp = str.match(/gettext\(\"[^"]+\"/ig) || [];
    tmp = tmp.concat(str.match(/gettext\(\'[^']+\'/ig) || [])
    return tmp.map(function(t) {
      return t + ')';
    }).join(';');
  }

  var buf = [], lineN;
  do {
    token = lexer.next();
    lineN = token.line - 1;
    switch(token.type) {
      case 'attrs':
        var tmp = [];
        Object.keys(token.attrs).forEach(function(key) {
          var r = extractGettext(token.attrs[key]);
          if (r.length) tmp.push(r);
        });
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

exports.generate         = gen;
exports.generateFromEJS  = genEJS;
exports.generateFromJade = genJade;
exports.generateFromJinja = genJinja;
