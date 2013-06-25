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

const parse_po = require('./parse_po');



var headerTmp = loadHeader();

function checkExpr(node, keyword) {
  return (node.type === "CallExpression" &&   // must be a call expression
            (
              (node.callee.name === 'gettext' ||            // with a gettext call expr
              (node.callee.name === keyword))               // or keyword call expr
              ||
              (node.callee.type === 'MemberExpression' &&   // or a member expr
              (node.callee.property.name === 'gettext' ||
               node.callee.property.name === keyword))
            )
            &&
            typeof node.arguments[0].value === 'string')  // must have a string argument
}

// generate extracted strings file
function gen (sources, options) {
  var generated = '';
  var strings = options['join-existing'] ? loadStrings(path.resolve(path.join(options['output-dir'] || '', options.output))) : {};

  Object.keys(sources).forEach(function (filename) {
    var source = sources[filename].replace(/^#.*/, ''); // strip leading hash-bang
    var ast    = parser.parse(source, {comment: true, tokens: true, loc: true, range: true});

    traverse(ast, {
      cursor: 0,
      enter: function (node) {
        if (checkExpr(node, options.keyword)) {
          var str = node.arguments[0].value;
          var line = node.loc.start.line;
          var comments = findComments(ast.comments, line);

          if (!strings[str]) strings[str] = {lines: {}, str: ''};
          strings[str].lines[filename + ':' + line] = comments;
        }
      }
    });

    function lineFromRange (range) {
      return source.slice(0, range[1]).split('\n').length;
    }

    // finds comments that end on the previous line
    function findComments (comments, line) {
      var found = '';
      comments.forEach(function (node) {
        var commentLine = lineFromRange(node.range);
        if (node.value.match(/^\s*L10n:/) &&
          (commentLine == line || commentLine + 1 == line)) {
          found += node.value.replace(/^\s*L10n:/, '');
        }
      });
      return found;
    }

  });

  for (var str in strings) {
      // TODO start and "\n" are ugly, but
      // getComment shouldn't break into multiple lines with #:
      var start = true;
      Object.keys(strings[str].lines).forEach(function (key) {
        if (start) {
          generated += "#:";
          start = false;
        }
        var ln = strings[str].lines[key];
        generated += genComment(key, ln);
      });
      generated += "\n" +
                   msgid(str) +
                   "msgstr "+JSON.stringify(strings[str].str) + "\n" +
                   "\n";
  }

  return headerTmp + generated;
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

function genComment (file, additional) {
  return " " + file +
    (additional ? "\n#" + additional.split("\n").join("\n#") : '') + "";
}

function msgid (str) {
  if (str.length > 72) {
    var chunks = chunkString(str);
    return 'msgid ""\n"' + chunks.join('"\n"') + '"\n';
  }
  return "msgid " + JSON.stringify(str) + "\n";
}

function chunkString (str) {
  var len = 77,
    curr  = len,
    prev  = 0,
    output = [],
    reg = /\w/;

  while (str[curr]) {
    for (; reg.test(str[curr]); curr--);
    output.push(str.substring(prev, ++curr));
    prev = curr;
    curr += len;
  }
  output.push(str.substr(prev));
  return output;
}

function loadHeader () {
  return fs.readFileSync(path.resolve(__dirname + '/header.po'), "utf8");
}

function loadStrings (poFile) {
  try {
    var json = parse_po(fs.readFileSync(path.resolve(poFile), "utf8"));
  } catch (e) {
    return {};
  }
  var strings = {};

  Object.keys(json).forEach(function (str) {
    if (str) {
      strings[str] = {lines: {}, str: json[str][2]};
      var files = json[str][0].join("\n").split(/\n?#: /g);
      files.shift();
      files.forEach(function (file) {
        var lines = file.split("\n");
        var fname = lines.shift().split(":");
        strings[str].lines[fname[0] + ':' + fname[1]] = lines.join("\n").replace(/(\n?)#/g, '$1');
      });
    }
  });

  return strings;
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
