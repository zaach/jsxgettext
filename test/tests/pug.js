"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var pug = require('../../lib/parsers/pug').pug;

var utils = require('../utils');

exports['test parsing'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, '..', 'inputs', 'example.pug');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {keyword: ['gettext', '_']},
        sources = {'inputs/example.pug': source},
        result = jsxgettext.generate.apply(jsxgettext, pug(sources, opts));

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');

    var outputFilename = path.join(__dirname, '..', 'outputs', 'pug.pot');

    utils.compareResultWithFile(result, outputFilename, assert, cb);
  });
};

exports['test regexp escaping'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, '..', 'inputs', 'second_attribute.pug');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    // if keyword is not escaped, this will throw an exception
    var opts = {keyword: ['foo)bar']},
        sources = {'inputs/second_attribute.pug': source};

    jsxgettext.generate.apply(jsxgettext, pug(sources, opts));
    // ..and won't reach to here.
    assert.ok(true, 'regexp should not throw');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
