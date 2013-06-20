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
    console.log('source', source);
    console.log('result', result);
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    cb();
  });
};


if (module == require.main) require('test').run(exports);
