'use strict';

var unescapedDoubleQuote = /([^\\])"|^"/g;
function escapeQuotes(str) {
  return str.replace(unescapedDoubleQuote, function (match, group) {
    var prefix = group || '';
    return prefix + '\\"';
  });
}

function parseSwig(str, filename, options) {
  var keyword = options.keyword || ['gettext'];
  // as swig is a slightly different parser (not looking for the keyword in the source,
  // just using the keyword for the function call) it will just take the first
  // keyword in case the keyword is an array
  if(Array.isArray(keyword)) {
    keyword = keyword[0];
  }

  var buf = [];
  var transTagRegex = /\{%\s*trans\s+['"]{1}(.+?)['"]{1}\s*%\}/mig;
  var gettextRegex = new RegExp(keyword + '\\([\'"]{1}(.+?)[\'"]{1}[^)]*\\)', 'mig');
  var blockTransRegex = /\{%\s*blocktrans.+?%}(((?!(\{%\s*endblocktrans\s*%\}))(?:\n|.))+)\{%\s*endblocktrans\s*%\}/mig;
  var matches, i, l, lineMatch, match, blockStr;

  matches = str.match(transTagRegex);
  if(matches) {
    for(i = 0, l = matches.length; i < l; i++) {
      lineMatch = matches[i];
      while((match = transTagRegex.exec(lineMatch)) !== null) {
        buf.push(keyword + '("' + escapeQuotes(match[1]) + '")');
      }
    }
  }
  matches = str.match(gettextRegex);
  if(matches) {
    for(i = 0, l = matches.length; i < l; i++) {
      lineMatch = matches[i];
      while((match = gettextRegex.exec(lineMatch)) !== null) {
        buf.push(keyword + '("' + escapeQuotes(match[1]) + '")');
      }
    }
  }
  matches = str.match(blockTransRegex);
  if(matches) {
    for(i = 0, l = matches.length; i < l; i++) {
      lineMatch = matches[i];
      while((match = blockTransRegex.exec(lineMatch)) !== null) {
        blockStr = escapeQuotes(match[1]).replace(/\n|\t/g, ' ');
        blockStr = blockStr.replace(/ +(?= )/g, '').trim();

        buf.push(keyword + '("' + blockStr + '")');
      }
    }
  }

  return buf.join('\n');
}

exports.swig = function swig(swigSources, options) {
  Object.keys(swigSources).forEach(function (filename) {
    swigSources[filename] = parseSwig(swigSources[filename], filename, options);
  });

  return [swigSources, options];
};
