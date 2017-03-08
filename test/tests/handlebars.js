"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var handlebars = require('../../lib/parsers/handlebars').handlebars;

exports['test handlebars'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, '..', 'inputs', 'example.handlebars');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var result = jsxgettext.generate.apply(jsxgettext, handlebars(
      {'inputs/example.handlebars': source}, { foo: true })
    );

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.equal(result.split(/msgid ".+"/).length, 7, 'exactly seven strings are found');
    assert.notEqual(result.indexOf('msgid "translated text"'), -1, 'result contains the first string');
    assert.notEqual(result.indexOf('msgid "block helper"'), -1, 'result contains the second string');
    assert.notEqual(result.indexOf('msgid "helpers"'), -1, 'result contains the third string');
    assert.notEqual(result.indexOf('msgid "so let\'s test"'), -1, 'result contains the fourth string');
    assert.notEqual(result.indexOf('msgid "for \\"quotes\\""'), -1, 'result contains the fourth string');
    assert.notEqual(result.indexOf('msgid "I would like to do %1$s too"'), -1, 'result contains the sprintf string');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
