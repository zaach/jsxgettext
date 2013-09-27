var fs = require('fs');

exports.compareResultWithFile = function (result, filePath, assert, cb, msg) {
  // Ignore the header
  result = result.slice(result.indexOf('\n\n') + 2);

  fs.readFile(filePath, function (err, source) {
    assert.equal(result, source.toString('utf8'), msg || 'Results match.');
    cb();
  });
};
