"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var utils = require('../utils');

exports['test gettext from first file'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, '..', 'inputs', 'extracted_comments.js');
  fs.readFile(inputFilename, 'utf8', function (err, source) {
    var result = jsxgettext.generate({'inputs/extracted_comments.js': source}, {});

    assert.equal(typeof result, 'string', 'Result should be a string');
    assert.ok(result.length > 0, 'Result should not be empty');

    var outputFilename = path.join(__dirname, '..', 'outputs', 'extracted_comments.pot');
    utils.compareResultWithFile(result, outputFilename, assert, cb);
  });
};

if (module === require.main) require('test').run(exports);
