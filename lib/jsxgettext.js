#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs   = require('fs');
const path = require('path');

const parser    = require('esprima');
const escodegen = require('escodegen');

const generate = escodegen.generate;
const traverse = escodegen.traverse;

var headerTmp = loadHeader();

// generate extracted strings file
function gen (source, filename) {
  var ast       = parser.parse(source, {comment: true, tokens: true, loc: true});
  var generated = '';
  var strings = {};

  traverse(ast, {
    cursor: 0,
    enter: function (node) {
      if (node.type !== "CallExpression" ||           // must be a call expression
          node.callee.name !== 'gettext' ||           // must be a gettext call
          typeof node.arguments[0].value !== 'string' // must have a string argument
          ) {
        return;
      }
      var str = node.arguments[0].value;
      var line = node.loc.start.line;
      var comments = findComments(ast.comments, line);

      if (!strings[str]) strings[str] = {lines: []};
      strings[str].lines.push([filename, line, comments]);
    }
  });

  var ln;
  for (var str in strings) {
      strings[str].lines.forEach(function (ln) {
        generated += genComment(ln[0], ln[1], ln[2]);
      });
      generated += msgid(str) +
                   "msgstr \"\"\n" +
                   "\n";
  }

  function lineFromRange (range) {
    return source.slice(0, range[1]).split('\n').length;
  }

  // finds comments that end on the previous line
  function findComments (comments, line) {
    var found = '';
    comments.forEach(function (node) {
      var commentLine = lineFromRange(node.range);
      if (node.value.match(/^\s*L10n:/) &&
        (commentLine == line ||
         commentLine + 1 == line)) {
        found += node.value.replace(/^\s*L10n:/, '');
      }
    });
    return found;
  }

  return headerTmp + generated;
}

// generate extracted strings file from EJS
function genEJS (ejsSource, filename) {
  var source = parseEJS(ejsSource);

  return gen(source, filename);
}

function genComment (file, line, additional) {
  return "#: " + file + ":" + line +
    (additional ? "\n#" + additional.split("\n").join("\n#:") : '') + "\n";
}

function msgid (str) {
  if (str.length > 75) {
    var chunks = chunkString(str);
    return 'msgid ""\n"' + chunks.join('"\n"') + '"\n';
  }
  return "msgid " + JSON.stringify(str) + "\n";
}

function chunkString (str) {
  var len = 76,
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
      buf.push(js);
      i += end - start + close.length - 1;

    } else if (str.substr(i, 1) == "\n") {
        buf.push("\n");
    }
  }

  return buf.join('');
}

exports.generate        = gen;
exports.generateFromEJS = genEJS;

