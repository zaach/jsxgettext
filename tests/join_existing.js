const
  fs = require('fs'),
  jsxgettext = require('../lib/jsxgettext'),
  utils = require('./utils'),
  path = require('path');

// Tests the --join-existing feature

/*
 * We use xgettext on files under inputs and save it's output
 * under outputs. These tests run jsxgettext against the
 * same inputs and test for identical output.
 */

var sourceFirstPass;

exports['we gettext from first file'] = function (assert, cb) {
  // We'll extract strings from inputs/first.js
  // This should match outputs/messages_firstpass.js
  var inputFilename = path.join(__dirname, 'inputs', 'first.js');
  fs.readFile(inputFilename, 'utf8', function (err, source) {
    var opts = {},
        sources = {'inputs/first.js': source},
        result = jsxgettext.generate(sources, 'inputs/first.js', opts);
    assert.equal(typeof result, 'string', 'Result should be a string');
    assert.ok(result.length > 0, 'Result should not be empty');
    var outputFilename = path.join(__dirname, 'outputs', 'messages_firstpass.pot');

    utils.compareResultWithFile(result, outputFilename, assert, function () {
      sourceFirstPass = source;

      // write to filesystem as join-existing will implicitly look for it, but...
      // TODO: So jsxgettext does the right thing with or without messages.po
      // that seems odd...
      fs.writeFileSync('messages.pot', result, "utf8");
      test2(assert, cb);
    });
  });
};

var test2 = function (assert, cb) {
  // We'll extract strings from inputs/second.js
  // This should match outputs/messages.js
  var inputFilename = path.join(__dirname, 'inputs', 'second.js');
  fs.readFile(inputFilename, 'utf8', function (err, source) {
    var opts = {"join-existing": true},
        sources = {'inputs/first.js': sourceFirstPass,
       'inputs/second.js': source},
        result = jsxgettext.generate(sources, 'inputs/second.js', opts);

    assert.equal(typeof result, 'string', 'Result should be a string');
    assert.ok(result.length > 0, 'Result should not be empty');
    var outputFilename = path.join(__dirname, 'outputs', 'messages_secondpass.pot');

    utils.compareResultWithFile(result, outputFilename, assert, function () {
      fs.unlink('messages.pot', cb);  // cleanup
    });
  });
};

if (module == require.main) require('test').run(exports);
