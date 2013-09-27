var jsxgettext = require('../lib/jsxgettext');

exports['test creation date'] = function (assert, cb) {
  var opts = {},
      sources = {'dummy': ''},
      result = jsxgettext.generate(sources, opts);

  var header = result.slice(0, result.indexOf('\n\n'));
  var timestamp = header.match(/POT-Creation-Date: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}[+-]\d{4})/)[1];
  assert.ok(timestamp.length > 0, 'Valid timestamp');
  // Timestamp should be at most 2 minutes in the past since it is truncated to minute
  assert.ok(Date.now() - new Date(timestamp).valueOf() < 120000, 'Timestamp up-to-date');

  cb();
};


if (module == require.main) require('test').run(exports);
