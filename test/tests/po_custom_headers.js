"use strict";

var jsxgettext = require('../../lib/jsxgettext');
var gettextParser = require('gettext-parser');

exports['test po custom headers'] = function (assert, cb) {
  var opts = {
    "po-headers": {
        "project-id-version": "MyProject 1.0",
        "language-team": "MyTeam <team@my.org>",
        "language": "en_US",
      }
    },
    sources = {'dummy': ''},
    result = jsxgettext.generate(sources, opts),
    parsed = gettextParser.po.parse(new Buffer(result));

  var headerCustom = {
    "project-id-version": "MyProject 1.0",
    "language-team": "MyTeam <team@my.org>",
    "language": "en_US"
  };

  var headers = parsed.headers;
  var headerKeys = Object.keys(headerCustom);
  var i, header;
  for (i = 0; i < headerKeys.length; i++) {
    header = headerKeys[i];
    assert.equal(headerCustom[header], headers[header], header);
  }

  cb();
};

if (module === require.main) require('test').run(exports);
