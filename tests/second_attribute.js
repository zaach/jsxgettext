"use strict";

var fs = require('fs');
var jsxgettext = require('../lib/jsxgettext');
var ejs = require('../lib/parsers/ejs').ejs;
var path = require('path');

exports['test second attribute'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'second_attribute.ejs');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var result = jsxgettext.generate.apply(jsxgettext, ejs(
      {'inputs/second_attribute.ejs': source}, {})
    );

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
