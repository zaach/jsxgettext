"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var ejs = require('../../lib/parsers/ejs').ejs;

exports['test ejs'] = function (assert, cb) {
  // check that include syntax doesn't break extraction
  var inputFilename = path.join(__dirname, '..', 'inputs', 'raw.ejs');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var result = jsxgettext.generate.apply(jsxgettext, ejs(
      {'inputs/include.ejs': source}, {})
    );

    assert.equal(typeof result, 'string', 'raw result is a string');
    assert.ok(result.length > 1, 'raw result is not empty');
    assert.ok(result.indexOf('this is a raw localizable string') !== -1,
              'raw localizable strings are extracted');
    assert.ok(result.indexOf('this is a raw localizable plural string') !== -1,
              'raw localizable plural strings are extracted');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
