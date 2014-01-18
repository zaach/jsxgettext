"use strict";

var fs   = require('fs');
var path = require('path');

var self = path.basename(__filename);

fs.readdirSync(__dirname).forEach(function (item) {
  if (item === self || path.extname(item) !== '.js' && !fs.statSync(item).isDirectory())
    return;

  var parser = require(path.join(__dirname, item));
  // Exports from a parser is lang -> parserMethod()
  Object.keys(parser).forEach(function (lang) {
    exports[lang] = parser[lang];
  });
});
