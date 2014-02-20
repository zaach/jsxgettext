"use strict";

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs   = require('fs');
var path = require('path');

var parser        = require('acorn');
var traverse      = require('acorn/util/walk').simple;
var gettextParser = require('gettext-parser');

var isTranslatable;
var extractStr;

function isStringLiteral(node) {
  return node.type === 'Literal' && (typeof node.value === 'string');
}

function isStrConcatExpr(node) {
  return node.type === "BinaryExpression" &&
      node.operator === '+' &&
      isTranslatable(node.left) &&
      isTranslatable(node.right);
}

function isArrayJoin(node) {
  return node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'ArrayExpression' &&
    node.callee.property.name === 'join' &&
    isTranslatable(node.arguments[0]) &&
    node.callee.object.elements.every(isTranslatable);
}

function isTranslatable(node) {
  return node && (
    isStringLiteral(node) ||
    isStrConcatExpr(node) ||
    isArrayJoin(node));
}

function getTranslatable(node, options) {
  // must be a call expression with arguments
  if (!node.arguments)
    return false;

  var callee = node.callee;
  var funcName = callee.name;
  var arg = node.arguments[0];
  var prop;

  if (!funcName) {
    if (callee.type !== 'MemberExpression')
      return false;

    // Special case for functionName.call calls
    if (callee.property.name === 'call') {
      prop = callee.object.property;
      funcName = callee.object.name || prop && (prop.name || prop.value);
      arg = node.arguments[1];  // skip context object
    } else {
      funcName = callee.property.name;
    }
  }

  if (funcName !== options.keyword && funcName !== 'gettext')
    return false;

  if (isTranslatable(arg))
    return arg;

  if (options.sanity)
    throw new Error("Could not parse translatable: " + JSON.stringify(arg, null, 2));
}

function extractArrayJoin(node) {
  var joiner = extractStr(node.arguments[0]);
  return node.callee.object.elements.map(extractStr).join(joiner);
}

// Assumes node is either a string Literal or a strConcatExpression
function extractStr(node) {
  if (isStringLiteral(node))
    return node.value;
  else if (isStrConcatExpr(node))
    return extractStr(node.left) + extractStr(node.right);
  else
    return extractArrayJoin(node);
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
  var useExisting = options['join-existing'];
  var poJSON;
  if (useExisting)
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
        "content-type": "text/plain; charset=utf-8",
        "content-transfer-encoding": "8bit"
      },
      translations: {'': {} }
    };

  var translations;

  try {
    poJSON.headers["pot-creation-date"] = new Date().toISOString().replace('T', ' ').replace(/:\d{2}.\d{3}Z/, '+0000');

    // Always use the default context for now
    // TODO: Take into account different contexts
    translations = poJSON.translations[''];
  } catch (err) {
    if (useExisting)
      throw new Error("An error occurred while using the provided PO file. Please make sure it is valid by using `msgfmt -c`.");
    else
      throw err;
  }

  options.keyword = options.keyword || 'gettext';
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

    traverse(ast, {'CallExpression': function (node) {
        var arg = getTranslatable(node, options);
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

// Backwards compatibility interface for 0.3.x - Deprecated!
var parsers = require('./parsers');

Object.keys(parsers).forEach(function (parser) {
  parser = parsers[parser];
  exports['generateFrom' + parser.name] = parser;
});
