"use strict";

var fs = require('fs');

exports.compareResultWithFile = function (result, filePath, assert, cb, msg) {
  // Ignore the header
  result = result.slice(result.indexOf('\n\n') + 2).trimRight();


  fs.readFile(filePath, function (err, source) {
    var sourceContent = source.toString('utf8').trimRight();
    assert.equal(result, sourceContent, msg || 'Results match.');
    cb();
  });
};
