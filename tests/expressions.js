var
fs = require('fs'),
jsxgettext = require('../lib/jsxgettext'),
utils = require('./utils'),
path = require('path');

exports['test different expression contexts for gettext'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'expressions.js');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {},
        sources = {'inputs/expressions.js': source},
        result = jsxgettext.generate(sources, 'inputs/expressions.js', opts);
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');

    var outputFilename = path.join(__dirname, 'outputs', 'expressions.pot');

    utils.compareResultWithFile(result, outputFilename, assert, cb);
  });
};

exports['test issue #25'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'pizza.js');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {},
        sources = {'inputs/pizza.js': source},
        result = jsxgettext.generate(sources, 'inputs/pizza.js', opts);
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');
    cb();
  });
};

exports['test concatenated strings (issue #10)'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, 'inputs', 'concat.js');
  var outputFilename = path.join(__dirname, 'outputs', 'concat.pot');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {},
        sources = {'inputs/concat.js': source},
        result = jsxgettext.generate(sources, opts);
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');

    utils.compareResultWithFile(result, outputFilename, assert, cb);
  });
};

if (module == require.main) require('test').run(exports);
