var
  jsxgettext = require('../lib/jsxgettext'),
  gettextParser = require('gettext-parser');

exports['test creation date'] = function (assert, cb) {
  var opts = {},
      sources = {'dummy': ''},
      result = jsxgettext.generate(sources, opts);

  var parsed = gettextParser.po.parse(new Buffer(result));
  var timestamp = parsed.headers["pot-creation-date"].match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}[+-]\d{4})/)[1];
  assert.ok(timestamp.length > 0, 'Valid timestamp');
  // Timestamp should be at most 2 minutes in the past since it is truncated to minute
  assert.ok(Date.now() - new Date(timestamp).valueOf() < 120000, 'Timestamp up-to-date');

  cb();
};


if (module == require.main) require('test').run(exports);
