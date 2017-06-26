"use strict";

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var path = require('path');

var parser = require('acorn-jsx');
var walk = require('acorn/dist/walk');
var gettextParser = require('gettext-parser');
var regExpEscape = require('escape-string-regexp');

var walkBase = Object.assign({}, walk.base, {
  JSXElement: function (node, st, c) {
    var i;

    for (i = 0; i < node.openingElement.attributes.length; i++) {
      c(node.openingElement.attributes[i], st);
    }

    for (i = 0; i < node.children.length; i++) {
      c(node.children[i], st);
    }
  },

  JSXAttribute: function (node, st, c) {
    if (node.value && node.value.type === 'JSXExpressionContainer') {
      c(node.value, st);
    }
  },

  JSXSpreadAttribute: function (node, st, c) {
    c(node.argument, st);
  },

  JSXExpressionContainer: function (node, st, c) {
    c(node.expression, st);
  },

  JSXEmptyExpression: function () { }
});

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

// check if the args (object or array of objects) are strings
function areArgsString(args) {
  return args && [].concat(args).every(function (arg) {
    return arg && (isStringLiteral(arg) || isStrConcatExpr(arg));
  });
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
      node.arguments = node.arguments.slice(1);  // skip context object
      arg = node.arguments[0];
    } else {
      funcName = callee.property.name;
    }
  }

  if (options.keyword.indexOf(funcName) === -1)
    return false;

  // Domain is not used during extraction, so ignore it
  if (funcName.substr(0, 1) === "d") {
    funcName = funcName.substr(1, funcName.length);
    node.arguments.splice(0, 1);
    arg = node.arguments[0];
  }

  // Always return array of context and translatables i.e. [context, textToTranslate1, textToTranslate2 ...]
  // If the gettext function's name starts with "np" (i.e. npgettext or np_) and its 3 arguments are strings and last argument is a number, we regard it as context
  // npgettext is mentioned in https://www.gnu.org/software/gettext/manual/gettext.html#Language-specific-options
  if (funcName.substr(0, 2) === "np" && areArgsString(node.arguments.slice(0, 3)))
    return [arg, node.arguments[1], node.arguments[2]];

  // If the gettext function's name starts with "n" (i.e. ngettext or n_) and its first 2 arguments are strings and last argument is a number, we regard it as a plural function
  if (funcName.substr(0, 1) === "n" && areArgsString(node.arguments.slice(0, 2)))
    return [null, arg, node.arguments[1]];

  // If the gettext function's name starts with "p" (i.e. pgettext or p_) and its 2 arguments are strings, we regard it as context 
  if (funcName.substr(0, 1) === "p" && areArgsString(node.arguments.slice(1)))
    return [arg, node.arguments[1]];

  // else it is gettext if its 1st argument is string
  if (areArgsString(node.arguments[0]))
    return [null, arg];

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
      translations: { '': { '': { comments: { flag: 'fuzzy' } } } }
    };
  }

  var translations;

  try {
    poJSON.headers["pot-creation-date"] = new Date().toISOString().replace('T', ' ').replace(/:\d{2}.\d{3}Z/, '+0000');
    translations = poJSON.translations;
  } catch (err) {
    if (useExisting)
      throw new Error("An error occurred while using the provided PO file. Please make sure it is valid by using `msgfmt -c`.");
    else
      throw err;
  }

  if (options.keyword) {
    Object.keys(options.keyword).forEach(function (index) {
      ['n', 'p', 'np', 'd', 'dn', 'dp', 'dnp'].forEach(function (keyword) {
        options.keyword.push(keyword + options.keyword[index]);
      });
    });
  }
  else {
    options.keyword = ['gettext', 'ngettext', 'pgettext', 'npgettext', 'dgettext', 'dngettext', 'dpgettext', 'dnpgettext'];
  }
  var tagName = options.addComments || "L10n:";
  var commentRegex = new RegExp([
    "^\\s*" + regExpEscape(tagName), // The "TAG" provided externally or "L10n:" by default
    "^\\/" // The "///" style comments which is the xgettext standard
  ].join("|"));
  Object.keys(sources).forEach(function (filename) {
    var source = sources[filename].replace(/^#.*/, ''); // strip leading hash-bang
    var astComments = [];
    var parserOptions = Object.assign({}, {
      ecmaVersion: 6,
      sourceType: 'module',
      plugins: { jsx: { allowNamespaces: false } },
      onComment: function (block, text, start, end, line/*, column*/) {
        text = text.match(commentRegex) && text.replace(/^\//, '').trim();

        if (!text)
          return;

        astComments.push({
          line: line,
          value: text
        });
      },
      locations: true
    }, options.parserOptions && JSON.parse(options.parserOptions));
    var ast = parser.parse(source, parserOptions);

    // finds comments that end on the previous line
    function findComments(comments, line) {
      return comments.map(function (node) {
        var commentLine = node.line.line;
        if (commentLine === line || commentLine + 1 === line) {
          return node.value;
        }
      }).filter(Boolean).join('\n');
    }

    walk.simple(ast, {
      'CallExpression': function (node) {
        var args = getTranslatable(node, options);
        if (!args)
          return;
        var msgCtxt = args[0] ? extractStr(args[0]) : "";
        var msgid = args[1];
        var str = extractStr(msgid);
        var line = node.loc.start.line;
        var comments = findComments(astComments, line);

        var ref = filename + ':' + line;
        if (!translations[msgCtxt])
          translations[msgCtxt] = {};
        if (!translations[msgCtxt][str]) {
          translations[msgCtxt][str] = {
            msgid: str,
            msgstr: [],
            comments: {
              extracted: comments,
              reference: ref
            }
          };
          // if it's npgettext
          if (args.length === 3 && args[0]) {
            translations[msgCtxt][str].msgctxt = msgCtxt;
            translations[msgCtxt][str].msgid_plural = extractStr(args[2]);
            translations[msgCtxt][str].msgstr = ['', ''];
          } else if (args.length === 3 && !args[0]) {
            // if it's ngettext
            translations[msgCtxt][str].msgid_plural = extractStr(args[2]);
            translations[msgCtxt][str].msgstr = ['', ''];
          } else if (args.length === 2 && args[0]) {
            // if it's pgettext
            translations[msgCtxt][str].msgctxt = msgCtxt;
            translations[msgCtxt][str].msgstr = ['', ''];
          }
        } else {
          if (translations[msgCtxt][str].comments)
            translations[msgCtxt][str].comments.reference += '\n' + ref;
          if (comments)
            translations[msgCtxt][str].comments.extracted += '\n' + comments;
        }
      }
    }, walkBase);


    function dedupeNCoalesce(item, i, arr) {
      return item && arr.indexOf(item) === i;
    }

    function extractComments(msgctxt, msgid) {
      var comments = translations[msgctxt][msgid].comments;
      if (!comments)
        return;
      if (comments.reference)
        comments.reference = comments.reference.split('\n').filter(dedupeNCoalesce).join('\n');
      if (comments.extracted)
        comments.extracted = comments.extracted.split('\n').filter(dedupeNCoalesce).join('\n');
    }

    Object.keys(translations).forEach(function (msgctxt) {
      Object.keys(translations[msgctxt]).forEach(extractComments.bind(null, msgctxt));
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
