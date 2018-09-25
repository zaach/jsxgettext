"use strict";

var lex = require('pug-lexer');
var parse = require('pug-parser');

// From MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegExp(string) {
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function parsePug(str, options) {
  options = options || {};

  var tokens = lex(str);
  var ast = new parse.Parser(tokens);
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

  var buf = [];

  function append(text, offset) {
    /* jshint -W040 */
    if (this.type === 'attrs') {
      // offset for attribute tokens are invalid
      // we treat all attr tokens to be on the same line as the first one =(
      offset = 0;
    }
    var line = this.loc.start.line + (offset || 0) - 1;
    if (text.length) {
      buf[line] = [buf[line], text, ';'].join('');
    }
  }

  do {
    token = ast.advance();
    switch (token.type) {
      case 'call':
        append.call(token, extractGettext(token.args));
        break;
      case 'interpolated-code':
      case 'attribute':
      case 'text':
      case 'code':
        append.call(token, extractGettext(token.val));
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

// generate extracted strings file from Pug templates
exports.pug = function Pug(pugSources, options) {
  Object.keys(pugSources).forEach(function (filename) {
    pugSources[filename] = parsePug(pugSources[filename], options);
  });

  return [pugSources, options];
};
