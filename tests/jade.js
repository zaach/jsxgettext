var fs = require('fs');
var jsxgettext = require('../lib/jsxgettext');
var path = require('path');

exports['test parsing'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'second_attribute.jade');
  fs.readFile(inputFilename, "utf8", function (err, source) {

    var opts = {keyword: '_'},
        sources = {'inputs/second_attribute.jade': source},
        result = jsxgettext.generateFromJade(sources, opts);

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.ok(result.indexOf('msgid "bar"') > -1, 'bar is found');
    assert.ok(result.indexOf('msgid "same-lime"') > -1, 'same-lime is found');
    assert.ok(result.indexOf('msgid "in text"') > -1, 'in text is found');
    assert.ok(result.indexOf('msgid "foobar"') > -1, 'foobar is found');
    assert.ok(result.indexOf('msgid "underscored"') > -1, 'underscored is found');
    cb();
  });
};
exports['test regexp escaping'] = function(assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'second_attribute.jade');
  fs.readFile(inputFilename, "utf8", function (err, source) {

      // if keyword is not escaped, this will throw an exception
      var opts = {keyword: 'foo)bar'},
          sources = {'inputs/second_attribute.jade': source},
          result = jsxgettext.generateFromJade(sources, opts);
      // ..and won't reach to here.
      assert.ok(true, 'regexp should not throw');
      cb();
  });
};


if (module == require.main) require('test').run(exports);
