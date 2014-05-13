'use strict';

var swig = require('swig');
swig = new swig.Swig();

function extractBlocktrans(token, buf, keyword) {
  if(token.name === 'blocktrans') {
    var compiled = token.compile(null, [], token.content).replace(/^.*_ctx\.gettext\("(.+)"(, {})?\);$/, keyword + '("$1");');
    buf.push(compiled);
    return true;
  }
  return false;
}

function extractTrans(token, buf, keyword) {
  if(token.name === 'trans') {
    buf.push(keyword + '(' + token.args + ');');
    return true;
  }
  return false;
}

function parseSwig(str, filename, options) {
  if(!options['support-module']) {
    throw new Error('Tags file needs to be submitted using the parameter `support-module` in order for swig compilation to work.');
  }
  var keyword = options.keyword || ['gettext'];
  // as swig is a slightly different parser (not looking for the keyword in the source,
  // just using the keyword for the function call) it will just take the first
  // keyword in case the keyword is an array
  if(Array.isArray(keyword)) {
    keyword = keyword[0];
  }

  var tags = require(options['support-module']);
  if(!(typeof tags === "function")) {
    throw new Error("Tags file needs to have a function which sets the tags on the swig object");
  }
  tags(swig);

  var tokens = swig.precompile(str, {
    filename: filename
  });

  tokens = tokens.tokens.tokens;

  var buf = [];

  for(var i = 0, len = tokens.length; i < len; i++) {
    if(typeof tokens[i] === "object") {
      extractBlocktrans(tokens[i], buf, keyword);
      extractTrans(tokens[i], buf, keyword);

      if(tokens[i].content) {
        for(var ci = 0, clen = tokens[i].content.length; ci < clen; ci++) {
          extractBlocktrans(tokens[i].content[ci], buf, keyword);
          extractTrans(tokens[i].content[ci], buf, keyword);
        }
      }
    }
    buf.push('');
  }

  return buf.join('\n');
}

exports.swig = function swig(swigSources, options) {
  Object.keys(swigSources).forEach(function (filename) {
    swigSources[filename] = parseSwig(swigSources[filename], filename, options);
  });

  return [swigSources, options];
};