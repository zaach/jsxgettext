"use strict";

var jsxgettext = require('../../lib/jsxgettext');
var gettextParser = require('gettext-parser');

exports['test po header'] = function (assert, cb) {
  var opts = {},
      sources = {'dummy': ''},
      result = jsxgettext.generate(sources, opts),
      parsed = gettextParser.po.parse(new Buffer(result));

  var headerDefaults = {
    "project-id-version": "PACKAGE VERSION",
    "language-team": "LANGUAGE <LL@li.org>",
    "po-revision-date": "YEAR-MO-DA HO:MI+ZONE",
    "language": "",
    "mime-version": "1.0",
    "content-type": "text/plain; charset=utf-8",
    "content-transfer-encoding": "8bit"
  };

  var headers = parsed.headers;
  var headerKeys = Object.keys(headerDefaults);
  var i, header;
  for (i = 0; i < headerKeys.length; i++) {
    header = headerKeys[i];
    assert.equal(headerDefaults[header], headers[header], header);
  }

  cb();
};

if (module === require.main) require('test').run(exports);
