"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var utils = require('../utils');

exports['test anonymous functions and method calls'] = function (assert, cb) {
  // method calls usually result in CallExpressions that does have an empty
  // .callee which, combined with an empty "keyword" argument, results them
  // being treated as a gettext call variant.
  var inputFilename = path.join(__dirname, '..', 'inputs', 'anonymous_functions.js');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var result = jsxgettext.generate({'inputs/anonymous_functions.js': source}, {});
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');

    var outputFilename = path.join(__dirname, '..', 'outputs', 'anonymous_functions.pot');
    utils.compareResultWithFile(result, outputFilename, assert, cb);
  });
};

if (module === require.main) require('test').run(exports);
