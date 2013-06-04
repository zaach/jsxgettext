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

exports['we gettext from first file'] = function (assert, cb) {
  // We'll extract strings from inputs/first.js
  // This should match outputs/messages_firstpass.js
  var inputFilename = path.join(__dirname, 'inputs', 'first.js');
  fs.readFile(inputFilename, 'utf8', function (err, source) {
    var opts = {},
        sources = {'inputs/first.js': source},
        result = jsxgettext.generate(sources, 'inputs/first.js', opts);
    assert.equal(typeof result, 'string');
    assert.ok(result.length > 0);
    var outputFilename = path.join(__dirname, 'outputs',
				   'messages_firstpass.pot');
    fs.readFile(outputFilename, function (err, source) {
      assert.ok(! err);

      var example = source.toString('utf8').split('\n');
      var actual = result.split('\n');

      for (var i=0; i < example.length; i++) {
        // Dynamic lines
        if (0 === example[i].indexOf('"POT-Creation-Date')) continue;

        // Reproducable lines
        assert.ok(i < actual.length,
		  'Num example output is at least as long as our result');
        assert.equal(actual[i], example[i], 'We match line for line');
      }
      assert.ok((actual.length == example.length ||
           actual.length - 1 == example.length),
          'Actual and Expected are the same length');
    });

    sourceFirstPass = source;

    // write to filesystem as join-existing will implicitly look for it, but...
    // TODO: So jsxgettext does the right thing with or without messages.po
    // that seems odd...
    fs.writeFileSync('messages.pot', result, "utf8");
    //cb();
    test2(assert, cb);
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

    assert.equal(typeof result, 'string');
    assert.ok(result.length > 0);
    var outputFilename = path.join(__dirname, 'outputs',
				   'messages_secondpass.pot');
    fs.readFile(outputFilename, function (err, source) {
      assert.ok(! err);

      var example = source.toString('utf8').split('\n');
      var actual = result.split('\n');

      for (var i=0; i < example.length; i++) {
        // Dynamic lines
        if (0 === example[i].indexOf('"POT-Creation-Date')) continue;
        // Reproducable lines
        assert.ok(i < actual.length,
		  'Num example output is at least as long as our result');
        assert.equal(actual[i], example[i], 'We match line for line');
      }
      assert.ok((actual.length == example.length ||
                 actual.length - 1 == example.length),
                'Actual and Expected are the same length');
      fs.writeFileSync('messages2.pot', result, "utf8");
      cb();
    });
  });
};

if (module == require.main) require('test').run(exports);
