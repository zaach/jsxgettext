var
fs = require('fs'),
jsxgettext = require('../lib/jsxgettext'),
path = require('path');

exports['test second attribute'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'second_attribute.ejs');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {},
        sources = {'inputs/second_attribute.ejs': source},
        result = jsxgettext.generateFromEJS(sources, 'inputs/second_attribute.ejs', opts);

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    cb();
  });
};


if (module == require.main) require('test').run(exports);
