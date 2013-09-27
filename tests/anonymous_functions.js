var
fs = require('fs'),
jsxgettext = require('../lib/jsxgettext'),
utils = require('./utils'),
path = require('path');

exports['test anonymous functions and method calls'] = function (assert, cb) {
  // method calls usually result in CallExpressions that does have an empty
  // .callee which, combined with an empty "keyword" argument, results them
  // being treated as a gettext call variant.
  var inputFilename = path.join(__dirname, 'inputs', 'anonymous_functions.js');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {},
        sources = {'inputs/anonymous_functions.js': source},
        result = jsxgettext.generate(sources, 'inputs/anonymous_functions.js', opts);
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');

    var outputFilename = path.join(__dirname, 'outputs', 'anonymous_functions.pot');
    utils.compareResultWithFile(result, outputFilename, assert, cb);
  });
};

if (module == require.main) require('test').run(exports);
