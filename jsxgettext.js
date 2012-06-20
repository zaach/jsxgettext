#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');
const ejs  = require('ejs');

const reflect   = require('reflect').Reflect;
const escodegen = require('escodegen');

const generate       = escodegen.generate;
const attachComments = escodegen.attachComments;
const traverse       = escodegen.traverse;

const VisitorOption = {
  Break: 1,
  Skip: 2
};

function gen (source, filename) {
  var ast       = reflect.parse(source, {comment: true, tokens: true, loc: true});
  var generated = '';

  // not used yet
  attachComments(ast, ast.comments, ast.tokens);
  //console.log(ast);

  var comment = makeCommentFn(filename);

  traverse(ast, {
    cursor: 0,
    enter: function (node) {
      if (node.type !== "CallExpression" ||           // must be a call expression
          node.callee.name !== 'gettext' ||           // must be a gettext call
          typeof node.arguments[0].value !== 'string' // must have a string argument
          ) {
        return;
      }
      var str = node.arguments[0].raw;
      var line = node.loc.start.line;

      generated += comment(line) + "\n" +
                   msgid(str);
    }
  });

  return generated;
}

function genEJS (ejsSource, filename) {
  ejsSource || (ejsSource = "<h1>\n\n\n<%= gettext('Last step!')/* blah */ %></h1>");
  var source = ejs.parse(ejsSource);
  //console.log(source);

  return gen(source, filename);
}

function makeCommentFn(file) {
  return function comment (line, additional) {
    return "#: " + file + ":" + line +
      (additional ? "\n#:" + additional.split("\n").join("\n#:") : '');
  };
}

function msgid (str) {
  return "msgid " + str + "\n";
}

exports.gen    = gen;
exports.genEJS = genEJS;

// demo
var test     = "var blah;\n/* I10n: This %s will be the user's name */\nvar foo = gettext(\"Hello %s, welcome back\");";
var filename = process.argv[2];
var source   = filename ? fs.readFileSync(filename, "utf8") : test;

var result = gen(source, filename || "foo.txt");

console.log(result);

