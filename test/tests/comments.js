"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');

// Tests parsing files with comments

exports['test comments'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, '..', 'inputs', 'test.js');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var result = jsxgettext.generate({'inputs/test.js': source}, {});
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
