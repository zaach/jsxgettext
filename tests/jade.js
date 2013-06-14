var fs = require('fs');
var jsxgettext = require('../lib/jsxgettext');
var path = require('path');

exports['test jade'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'second_attribute.jade');
  fs.readFile(inputFilename, "utf8", function (err, source) {

    var opts = {},
        sources = {'inputs/second_attribute.jade': source},
        result = jsxgettext.generateFromJade(sources, 'inputs/second_attribute.jade', opts);
    
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    cb();
  });
};


if (module == require.main) require('test').run(exports);
