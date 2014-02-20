"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');

exports['test sanity checking'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, '..', 'inputs', 'insane.js');

  fs.readFile(inputFilename, "utf8", function (err, source) {
    assert.throws(function () {
        jsxgettext.generate(
          {'inputs/insane.js': source},
          {sanity: true});
      },
      /Could not parse translatable:/,
      "error was thrown for bad input");

    cb();
  });
};

if (module === require.main) require('test').run(exports);
