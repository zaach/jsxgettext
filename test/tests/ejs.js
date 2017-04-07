"use strict";

var fs = require('fs');
var path = require('path');
var utils = require('../utils');

var jsxgettext = require('../../lib/jsxgettext');
var ejs = require('../../lib/parsers/ejs').ejs;

exports['test ejs'] = function (assert, cb) {
  // check that include syntax doesn't break extraction
  var inputFilename = path.join(__dirname, '..', 'inputs', 'include.ejs');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var result = jsxgettext.generate.apply(jsxgettext, ejs(
      {'inputs/include.ejs': source}, {})
    );

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.ok(result.indexOf('this is a localizable string') !== -1,
              'localizable strings are extracted');
    assert.ok(result.indexOf('this is a localizable plural string') !== -1,
              'localizable plural strings are extracted');
    var singleLineResult = utils.getSingleLineString(result);
    assert.ok(singleLineResult.indexOf('msgctxt "context_1"msgid "this is a localizable string in context"') !== -1, 'localizable string in context 1 are extracted');    
    assert.ok(singleLineResult.indexOf('msgctxt "context_1"msgid "this is a localizable singular string in context"msgid_plural "this is a localizable plural string in context"') !== -1, 'localizable plural strings in context 1 are extracted');
    assert.ok(singleLineResult.indexOf('msgctxt "context_2"msgid "this is a localizable string in context"') !== -1, 'localizable string in context 2 are extracted');
    assert.ok(singleLineResult.indexOf('msgctxt "context_1"msgid "this is a localizable singular string in context"msgid_plural "this is a localizable plural string in context"') !== -1, 'localizable plural strings in context 2 are extracted');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
