#!/usr/bin/env node
var fs         = require('fs');
var path       = require('path');
var jsxgettext = require('./jsxgettext');

var opts = require("nomnom")
   .script('jsxgettext')
   .option('output', {
      abbr: 'o',
      metavar: 'FILE',
      default: 'messages.po',
      help: 'write output to specified file'
   })
   .option('output-dir', {
      abbr: 'p',
      metavar: 'DIR',
      help: 'output files will be placed in directory DIR'
   })
   .option('version', {
      abbr: 'v',
      flag: true,
      help: 'print version and exit',
      callback: function() {
         return require('../package.json').version;
      }
   })
   .option('input', {
      position: 0,
      required: true,
      help: 'input file'
   })
   .option('keyword', {
      abbr: 'k',
      metavar: 'WORD',
      help: 'additional keyword to be looked for'
   })
   .option('join-existing', {
      abbr: 'j',
      flag: true,
      help: 'join messages with existing file (TODO)'
   })
   .option('language', {
      abbr: 'L',
      metavar: 'NAME',
      default: 'JS',
      help: 'recognise the specified language (JS, EJS)'
   })
   .parse();

function main () {
  var filename = opts.input;

  read(filename, function (err, source) {
    var ext = path.extname(filename);
    var result;

    if (opts.language.toUpperCase() === 'JS') {
      result = jsxgettext.generate(source, filename, opts);
    } else {
      result = jsxgettext.generateFromEJS(source, filename, opts);
    }
    if (opts.output === '-') {
      console.log(result);
    } else {
      fs.writeFileSync(path.resolve(path.join(opts['output-dir'] || '', opts.output)), result, "utf8");
    }
  });
}

function read (fname, cb) {
  if (fname === '-') {
  } else {
    fs.readFile(fname, "utf8", cb);
  }
}

main();
