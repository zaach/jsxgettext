"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var jade = require('../../lib/parsers/jade').jade;


exports['test parsing'] = function (assert, cb) {
  function assertMsg(result, msg) {
    msg = '"' + msg + '"';
    assert.ok(result.indexOf('msgid ' + msg) > -1, msg + ' is found');
  }

  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, '..', 'inputs', 'second_attribute.jade');
  fs.readFile(inputFilename, "utf8", function (err, source) {

    var opts = {keyword: ['gettext', '_']},
        sources = {'inputs/second_attribute.jade': source},
        result = jsxgettext.generate.apply(jsxgettext, jade(sources, opts));

    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assertMsg(result, 'bar');
    assertMsg(result, 'same-line');
    assertMsg(result, 'in text');
    assertMsg(result, 'foobar');
    assertMsg(result, 'underscored');
    assertMsg(result, 'underscored 1');
    assertMsg(result, 'underscored 2');

    assertMsg(result, 'data attribute');
    assertMsg(result, 'attribute - one per line');
    assertMsg(result, 'value  - one per line');
    cb();
  });
};

exports['test regexp escaping'] = function (assert, cb) {
  // check that files with leading hash parse
  var inputFilename = path.join(__dirname, '..', 'inputs', 'second_attribute.jade');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    // if keyword is not escaped, this will throw an exception
    var opts = {keyword: ['foo)bar']},
        sources = {'inputs/second_attribute.jade': source};

    jsxgettext.generate.apply(jsxgettext, jade(sources, opts));
    // ..and won't reach to here.
    assert.ok(true, 'regexp should not throw');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
