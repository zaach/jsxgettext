"use strict";

var fs = require('fs');

var compareResultWithFile = function (result, filePath, assert, cb, msg) {
  // Ignore the header
  result = result.slice(result.indexOf('\n\n') + 2).trimRight();


  fs.readFile(filePath, function (err, source) {
    var sourceContent = source.toString('utf8').trimRight();
    assert.equal(getSingleLineString(result), getSingleLineString(sourceContent), msg || 'Results match.');
    cb();
  });
};
exports.compareResultWithFile = compareResultWithFile;

var getSingleLineString = function(string){
  return string.replace(/[\r\n]*/g, "")
}
exports.getSingleLineString = getSingleLineString;
