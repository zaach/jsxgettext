'use strict';

var swig = require('swig');
swig = new swig.Swig();

function parseSwig(str, filename, options) {
  if(!options.swigTags) {
    throw new Errror('Tags file needs to be submitted in order for swig compilation to work.');
  }
  var keyword = options.keyword || 'gettext';

  var tags = require(options.swigTags);
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
    outer_loop:
    if(typeof tokens[i] === "object") {
      var content = tokens[i].content;
      if(tokens[i].name === 'blocktrans') {
        var compiled = tokens[i].compile(null, [], content).replace(/^.*_ctx\.gettext\("(.+)"(, {})?\);$/, keyword + '("$1");');
        buf.push(compiled);
        break outer_loop;
      }
      for(var ci = 0, clen = content.length; ci < clen; ci++) {
        if(content[ci].name === 'trans') {
          buf.push(keyword + '(' + content[ci].args + ');');
          break outer_loop;
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