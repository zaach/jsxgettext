"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var swigParser = require('../../lib/parsers/swig').swig;
var swig = require('swig');

exports['test single file parsing'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, '..', 'inputs', 'example.swig');
  fs.readFile(inputFilename, "utf8", function (err, source) {

    var opts = {
          'support-module': '../../node_modules/swig-i18n-abide'
        },
        sources = {'inputs/example.swig': source},
        result = jsxgettext.generate.apply(jsxgettext, swigParser(sources, opts));

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.ok(result.indexOf('msgid "Hello foobar"') > -1, 'Trans tag found');
    assert.ok(result.indexOf('msgid "Hello <a href=\\"%(url)s\\">%(name)s</a>. Pleasure to meet you."') > -1, 'Blocktrans tag found');
    cb();
  });
};

exports['test multi file parsing'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, '..', 'inputs', 'example-multifile.swig');
  fs.readFile(inputFilename, "utf8", function (err, source) {

    var opts = {
          'support-module': '../../node_modules/swig-i18n-abide'
        },
        sources = {'inputs/example-multifile.swig': source},
        result = jsxgettext.generate.apply(jsxgettext, swigParser(sources, opts));

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.ok(result.indexOf('msgid "Multifile title"') > -1, 'Multifile title found');
    assert.ok(result.indexOf('msgid "another test in layout-swig-include"') > -1, 'Another test in layout-swig-include found');
    assert.ok(result.indexOf('msgid "Hello foobar"') > -1, 'Trans tag found');
    assert.ok(result.indexOf('msgid "Hello <a href=\\"%(url)s\\">%(name)s</a>. Pleasure to meet you."') > -1, 'Blocktrans tag found');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
