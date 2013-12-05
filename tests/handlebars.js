var fs = require('fs');
var jsxgettext = require('../lib/jsxgettext');
var path = require('path');

exports['test handlebars'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, 'inputs', 'example.handlebars');
  fs.readFile(inputFilename, "utf8", function (err, source) {

    var opts = {},
        sources = {'inputs/example.handlebars': source},
        result = jsxgettext.generateFromHandlebars(sources, 'inputs/example.handlebars', opts);
    
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.equal(result.split(/msgid ".+"/).length, 4, 'exactly three strings are found')
    assert.notEqual(result.indexOf('msgid "translated text"'), -1, 'result contains the first string')
    assert.notEqual(result.indexOf('msgid "block helper"'), -1, 'result contains the second string')
    assert.notEqual(result.indexOf('msgid "so let\'s test"'), -1, 'result contains the third string')
    cb();
  });
};


if (module == require.main) require('test').run(exports);
