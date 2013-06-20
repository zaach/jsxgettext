var fs = require('fs');
var jsxgettext = require('../lib/jsxgettext');
var path = require('path');

exports['test ejs'] = function (assert, cb) {
  // check that include syntax doesn't break extraction
  var inputFilename = path.join(__dirname, 'inputs', 'include.ejs');
  fs.readFile(inputFilename, "utf8", function (err, source) {

    var opts = {},
        sources = {'inputs/include.ejs': source},
        result = jsxgettext.generateFromEJS(sources, 'inputs/include.js', opts);
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.ok(result.indexOf('this is a localizable string') !== -1,
              'localizable strings are extracted');
    cb();
  });
};


if (module == require.main) require('test').run(exports);
