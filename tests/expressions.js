var
fs = require('fs'),
jsxgettext = require('../lib/jsxgettext'),
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

    var outputFilename = path.join(__dirname, 'outputs',
                                  'expressions.po');

    fs.readFile(outputFilename, function (err, source) {
      assert.equal(result, source.toString('utf8'), 'results match');
      cb();
    });
  });
};


if (module == require.main) require('test').run(exports);
