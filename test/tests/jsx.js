"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var jsx = require('../../lib/parsers/jsx').jsx;

var utils = require('../utils');

exports['test parsing'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, '..', 'inputs', 'example.jsx');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {keyword: ['gettext', '_']},
      sources = {'inputs/example.jsx': source},
      result = jsxgettext.generate.apply(jsxgettext, jsx(sources, opts));

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');

    var outputFilename = path.join(__dirname, '..', 'outputs', 'jsx.pot');

    utils.compareResultWithFile(result, outputFilename, assert, cb);
  });
};

if (module === require.main) require('test').run(exports);
