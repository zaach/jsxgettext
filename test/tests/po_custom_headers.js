"use strict";

var jsxgettext = require('../../lib/jsxgettext');
var gettextParser = require('gettext-parser');

exports['test po custom headers'] = function (assert, cb) {
  var opts = {
      "projectIdVersion": "MyProject 1.0",
      "reportBugsTo": "bugs@project.org",
      "languageTeam": "this cannot be overridden"
    },
    sources = {'dummy': ''},
    result = jsxgettext.generate(sources, opts),
    parsed = gettextParser.po.parse(new Buffer(result));

  var headerCustom = {
    "project-id-version": "MyProject 1.0",
    "report-msgid-bugs-to": "bugs@project.org"
  };

  var headers = parsed.headers;
  var headerKeys = Object.keys(headerCustom);
  var i, header;

  assert.equal(headers['language-team'], "LANGUAGE <LL@li.org>", "According to gettext specs, this should not be overridden.");
  for (i = 0; i < headerKeys.length; i++) {
    header = headerKeys[i];
    assert.equal(headerCustom[header], headers[header], header);
  }

  cb();
};

if (module === require.main) require('test').run(exports);
