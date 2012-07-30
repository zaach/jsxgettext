var
fs = require('fs'),
jsxgettext = require('../lib/jsxgettext'),
path = require('path');

// Tests the --join-existing feature

/*
 * We use xgettext on files under inputs and save it's output
 * under outputs. These tests run jsxgettext against the
 * same inputs and test for identical output.
 */

var sourceFirstPass;

exports['leading hash'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'hash.js');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {},
        sources = {'inputs/first.js': source},
        result = jsxgettext.generate(sources, 'inputs/hash.js', opts);
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');
  });
};


if (module == require.main) require('test').run(exports);
