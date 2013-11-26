var
fs = require('fs'),
jsxgettext = require('../lib/jsxgettext'),
path = require('path');

// Tests parsing files with comments

exports['test quotes and newlines when folding msgid'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, 'inputs', 'po_quotes.js');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var opts = {},
        sources = {'inputs/po_quotes.js': source},
        result = jsxgettext.generate(sources, 'inputs/po_quotes.js', opts);

    // short line is escaped properly
    assert.ok(result.indexOf('\nmsgid "Hello \\"World\\"\\n"\n')>=0, 'short line');

    // long folded line should also get escaped
    assert.ok(result.indexOf('\n"This is a long string with \\"quotes\\", newlines \\n"\n')>=0, 'long folded line, 1');
    assert.ok(result.indexOf('\n" and such. The line should get folded"\n')>=0, 'long folded line, 2');

    cb();
  });
};


if (module == require.main) require('test').run(exports);
