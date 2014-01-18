"use strict";

var fs   = require('fs');
var path = require('path');

var self = path.basename(__filename);

fs.readdirSync(__dirname).forEach(function (item) {
  if (item === self || path.extname(item) !== '.js' && !fs.statSync(item).isDirectory())
    return;

  exports['test ' + path.basename(item, '.js')] = require(path.join(__dirname, item));
});

if (module === require.main)
  require('test').run(exports);
