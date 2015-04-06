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

  var buf = [], lineN, lineAdjust = -1;

  function append(text) {
    /* jshint -W040 */
    var ctx = this;
    if (ctx && ctx.bump) {
      lineN += 1;
    }
    if (text.length) {
      buf[lineN] = [buf[lineN], text, ';'].join('');
    }
  }

  do {
    token = lexer.next();
    lineN = token.line + lineAdjust;
    switch (token.type) {
      case 'attrs':
        Object.keys(token.attrs)
          .map(extractFromObj, token.attrs)
          .forEach(append);
        break;
      case 'text':
      case 'code':
        append(extractGettext(token.val));
        break;
      case 'pipeless-text':
        token.val
          .map(extractGettext)
          .forEach(append, { bump: true });
        lineAdjust += token.val.length;
        break;
      case 'comment':
        if (/^\s*L10n:/.test(token.val)) {
          append(['/*', token.val, '*/'].join(''));
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
