"use strict";

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs   = require('fs');
var path = require('path');

var parser        = require('acorn');
var traverse      = require('acorn/dist/walk').simple;
var gettextParser = require('gettext-parser');
var regExpEscape  = require('escape-string-regexp');

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
      node.arguments = node.arguments.slice( 1 );  // skip context object
      arg = node.arguments[0];
    } else {
      funcName = callee.property.name;
    }
  }

  if (options.keyword.indexOf(funcName) === -1)
    return false;

  // If the gettext function's name starts with "n" (i.e. ngettext or n_) and its first 2 arguments are strings, we regard it as a plural function
  if (arg && funcName.substr(0, 1) === "n" && (isStrConcatExpr(arg) || isStringLiteral(arg)) && node.arguments[1] && (isStrConcatExpr(node.arguments[1]) || isStringLiteral(node.arguments[1])))
    return [arg, node.arguments[1]];

  if (arg && (isStrConcatExpr(arg) || isStringLiteral(arg)))
    return arg;

  if (options.sanity)
    throw new Error("Could not parse translatable: " + JSON.stringify(arg, null, 2));
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

function parse(sources, options) {
  var useExisting = options.joinExisting;
  var poJSON;
  if (useExisting)
    poJSON = loadStrings(path.resolve(path.join(options.outputDir || '', options.output)));

  if (!poJSON) {
    var headers = {
      "project-id-version": options.projectIdVersion || "PACKAGE VERSION",
      "language-team": "LANGUAGE <LL@li.org>",
      "report-msgid-bugs-to": options.reportBugsTo,
      "po-revision-date": "YEAR-MO-DA HO:MI+ZONE",
      "language": "",
      "mime-version": "1.0",
      "content-type": "text/plain; charset=utf-8",
      "content-transfer-encoding": "8bit"
    };

    poJSON = {
      charset: "utf-8",
      headers: headers,
      translations: {'': {} }
    };
  }

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

  if( options.keyword ) {
    Object.keys(options.keyword).forEach(function (index) {
      options.keyword.push('n' + options.keyword[index]);
    });
  }
  else {
    options.keyword = ['gettext', 'ngettext'];
  }
  var tagName = options.addComments || "L10n:";
  var commentRegex = new RegExp([
    "^\\s*" + regExpEscape(tagName), // The "TAG" provided externally or "L10n:" by default
    "^\\/" // The "///" style comments which is the xgettext standard
  ].join("|"));
  Object.keys(sources).forEach(function (filename) {
    var source   = sources[filename].replace(/^#.*/, ''); // strip leading hash-bang
    var astComments = [];
    var ast      = parser.parse(source, {
      ecmaVersion: 6,
      onComment: function (block, text, start, end, line/*, column*/) {
        text = text.match(commentRegex) && text.replace(/^\//, '').trim();

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
        var commentLine = node.line.line;
        if (commentLine === line || commentLine + 1 === line) {
          return node.value;
        }
      }).filter(Boolean).join('\n');
    }

    traverse(ast, {'CallExpression': function (node) {
        var arg = getTranslatable(node, options);
        if (!arg)
          return;

        var msgid = arg;
        if( arg.constructor === Array )
            msgid = arg[0];
        var str = extractStr(msgid);
        var line = node.loc.start.line;
        var comments = findComments(astComments, line);

        var ref = filename + ':' + line;
        if (!translations[str]) {
          translations[str] = {
            msgid: str,
            msgstr: [],
            comments: {
              extracted: comments,
              reference: ref
            }
          };
          if( arg.constructor === Array ) {
              translations[str].msgid_plural = extractStr(arg[1]);
              translations[str].msgstr = ['', ''];
          }
        } else {
          if(translations[str].comments) {
            translations[str].comments.reference +=  '\n' + ref;
          }
          if (comments)
            translations[str].comments.extracted += '\n' + comments;
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
      if (comments.extracted)
        comments.extracted = comments.extracted.split('\n').filter(dedupeNCoalesce).join('\n');
    });
  });

  return poJSON;
}
exports.parse = parse;

// generate extracted strings file
function gen(sources, options) {
  return gettextParser.po.compile(parse(sources, options)).toString();
}

exports.generate = gen;

// Backwards compatibility interface for 0.3.x - Deprecated!
var parsers = require('./parsers');

Object.keys(parsers).forEach(function (parser) {
  parser = parsers[parser];
  exports['generateFrom' + parser.name] = parser;
});
