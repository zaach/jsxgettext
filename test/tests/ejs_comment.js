"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var ejs = require('../../lib/parsers/ejs').ejs;

exports['test ejs'] = function (assert, cb) {
  // check that include syntax doesn't break extraction
  var inputFilename = path.join(__dirname, '..', 'inputs', 'comment.ejs');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var result = jsxgettext.generate.apply(jsxgettext, ejs(
      {'inputs/include.ejs': source}, {})
    );

    assert.equal(typeof result, 'string', 'comment result is a string');
    assert.ok(result.length > 1, 'comment result is not empty');
    assert.ok(result.indexOf('this is a non localizable comment string') === -1,
              'comment strings are not extracted');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
