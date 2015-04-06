"use strict";

var jade = require('jade');

// From MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegExp(string) {
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function parseJade(str, options) {
  options = options || {};

  var parser = new jade.Parser(str);
  var lexer = parser.lexer;
  var token;

  options.keyword = options.keyword || ['gettext'];

  var gettextRegexPrefix = '(?:' + options.keyword.map(escapeRegExp).join('|') + ')';
  var gettexRegex = new RegExp(gettextRegexPrefix + '(?:\\(\"[^"]+\"|\\(\'[^\']+\')', 'gi');

  function extractGettext(str) {
    if (typeof(str) !== 'string') return '';

    var tmp = str.match(gettexRegex) || [];
    return tmp.map(function (t) {
      return t + ')';
    }).join(';');
  }

  function extractFromObj(key) {
    /* jshint -W040 */
    return extractGettext(this[key].val);
  }

  function isEmpty(obj) {
    return obj.length;
  }

  var buf = [], lineN, tmp;
  do {
    token = lexer.next();
    lineN = token.line - 1;
    switch (token.type) {
      case 'attrs':
        tmp = Object.keys(token.attrs).map(extractFromObj, token.attrs).filter(isEmpty);
        if (tmp.length)
          buf[lineN] = tmp.join(';') + ';';
        break;
      case 'text':
      case 'code':
        tmp = extractGettext(token.val);
        if (tmp.length) buf[lineN] = tmp + ';';
        break;
    }
  } while (token.type !== 'eos');

  return buf.join('\n');
}

// generate extracted strings file from Jade templates
exports.jade = function Jade(jadeSources, options) {
  Object.keys(jadeSources).forEach(function (filename) {
    jadeSources[filename] = parseJade(jadeSources[filename], options);
  });

  return [jadeSources, options];
};
