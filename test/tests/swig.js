"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var swigParser = require('../../lib/parsers/swig').swig;

exports['test single file parsing'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, '..', 'inputs', 'example.swig');
  fs.readFile(inputFilename, "utf8", function (err, source) {

    var sources = {'inputs/example.swig': source},
        result = jsxgettext.generate.apply(jsxgettext, swigParser(sources, {}));

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.ok(result.indexOf('msgid "Hello foobar"') > -1, 'Trans tag found');
    assert.ok(result.indexOf('msgid "Test gettext directly"') > -1, 'Gettext function call found');
    assert.ok(result.indexOf('msgid "Test with additional params on new line"') > -1, 'Gettext with newline function call found');
    assert.ok(result.indexOf('msgid "Hello <a href=\\"%(url)s\\">%(name)s</a>. Pleasure to meet you."') > -1, 'Blocktrans tag found');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
