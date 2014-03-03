"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var utils = require('../utils');

exports['test with multiple keywords'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, '..', 'inputs', 'multiple_keywords.js');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var options = {keyword: ['_', 't']};
    var result = jsxgettext.generate({'inputs/multiple_keywords.js': source}, options);
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');

    var outputFilename = path.join(__dirname, '..', 'outputs', 'multiple_keywords.pot');

    utils.compareResultWithFile(result, outputFilename, assert, cb);
  });
};

if (module === require.main) require('test').run(exports);
