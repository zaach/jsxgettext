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
      list: true,
      help: 'input files'
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
  var files = opts.input;

  if (files[0] === '-') {
  } else {
    var sources = {};
    files.forEach(function (filename) {
      var source = fs.readFileSync(filename, "utf8");
      sources[filename] = source;
    });

    var result;
    if (opts.language.toUpperCase() === 'EJS') {
      result = jsxgettext.generateFromEJS(sources, opts);
    } else {
      result = jsxgettext.generate(sources, opts);
    }
    if (opts.output === '-') {
      console.log(result);
    } else {
      fs.writeFileSync(path.resolve(path.join(opts['output-dir'] || '', opts.output)), result, "utf8");
    }
  }
}

function process (source) {
}

function read (fname, cb) {
  if (fname === '-') {
  } else {
    fs.readFileSync(fname, "utf8");
  }
}

main();
