"use strict";

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs   = require('fs');
var path = require('path');

var parser        = require('acorn');
var estraverse    = require('estraverse');
var gettextParser = require('gettext-parser');

var traverse = estraverse.traverse;

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

function getTranslatable(node, keyword) {
  // must be a call expression with arguments
  if (node.type !== "CallExpression" || !node.arguments)
    return false;

  var callee = node.callee;
  var funcName = callee.name;
  var arg = node.arguments[0];

  if (!funcName) {
    if (callee.type !== 'MemberExpression')
      return false;

    // Special case for gettext.call calls (or keyword.call)
    if (callee.property.name === 'call') {
      funcName = callee.object.name;
      arg = node.arguments[1];  // skip context object
    } else {
      funcName = callee.property.name;
    }
  }

  if ((funcName === 'gettext' || funcName === keyword) &&
       arg && (isStrConcatExpr(arg) || isStringLiteral(arg)))
    return arg;
}

// Assumes node is either a string Literal or a strConcatExpression
function extractStr(node) {
  if (isStringLiteral(node))
    return node.value;
  else
    return extractStr(node.left) + extractStr(node.right);
}

function loadStrings(poFile) {
  try {
    return gettextParser.po.parse(fs.readFileSync(path.resolve(poFile)), "utf-8");
  } catch (e) {
    return null;
  }
}

// generate extracted strings file
function gen(sources, options) {
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
    var source   = sources[filename].replace(/^#.*/, ''); // strip leading hash-bang
    var astComments = [];
    var ast      = parser.parse(source, {
      onComment: function (block, text, start, end, line/*, column*/) {
        text = text.replace(/^\s*L10n:/, '');

        if (!text)
          return;

        astComments.push({
          line : line,
          value: text
        });
      },
      locations: true
    });

    // finds comments that end on the previous line
    function findComments(comments, line) {
      return comments.map(function (node) {
        var commentLine = node.line;
        if (commentLine === line || commentLine + 1 === line) {
          return node.value;
        }
      }).filter(Boolean).join('\n');
    }

    traverse(ast, {
      cursor: 0,
      enter: function (node) {
        var arg = getTranslatable(node, options.keyword);
        if (!arg)
          return;

        var str = extractStr(arg);
        var line = node.loc.start.line;
        var comments = findComments(astComments, line);

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

exports.generate = gen;
