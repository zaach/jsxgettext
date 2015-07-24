"use strict";
var simple = require('jstransform/simple');


var REGEX_FORMAT = /^export\sdefault/gm;
var REPLACE_REGEX_FORMAT_STR = "exports['default'] = ";

function parseJSX(code){
  var options = {};
  options.es6module = true;
  options.react = true;

  var result = simple.transform(code, options);
  return result.code.replace(REGEX_FORMAT, REPLACE_REGEX_FORMAT_STR);
}

exports.jsx = function jsx(sources, options){
  Object.keys(sources).forEach(function (filename) {
    sources[filename] = parseJSX(sources[filename]);
  });

  return [sources, options];
};
