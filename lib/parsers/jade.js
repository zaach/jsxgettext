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

  var gettextRegexPrefix = '\\w*(?:' + options.keyword.map(escapeRegExp).join('|') + ')';
  var argRegex = /\s*(?:"[^"]+"|'[^']+')\s*/;
  var gettexRegex = new RegExp(gettextRegexPrefix + '\\(' + argRegex.source + '(?:,' + argRegex.source + ')?', 'gi');

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

  var buf = [];

  function append(text, offset) {
    /* jshint -W040 */
    if (this.type === 'attrs') {
      // offset for attribute tokens are invalid
      // we treat all attr tokens to be on the same line as the first one =(
      offset = 0;
    }
    var line = this.line + (offset || 0) - 1;
    if (text.length) {
      buf[line] = [buf[line], text, ';'].join('');
    }
  }

  do {
    token = lexer.next();
    switch (token.type) {
      case 'attrs':
        Object.keys(token.attrs)
          .map(extractFromObj, token.attrs)
          .forEach(append, token);
        break;
      case 'call':
        append.call(token, extractGettext(token.args));
        break;
      case 'text':
      case 'code':
        append.call(token, extractGettext(token.val));
        break;
      case 'pipeless-text':
        token.line -= token.val.length - 1;
        token.val
          .map(extractGettext)
          .forEach(append, token);
        break;
      case 'comment':
        if (/^\s*L10n:/.test(token.val)) {
          append.call(token, ['/*', token.val, '*/'].join(''));
        }
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
