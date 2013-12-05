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
      help: 'join messages with existing file'
   })
   .option('language', {
      abbr: 'L',
      metavar: 'NAME',
      default: 'JavaScript',
      help: 'recognise the specified language (JavaScript, EJS, Jinja, Jade, Handlebars)'
   })
   .parse();

function main () {
  var files = opts.input;
  var sources = {};

  if (files[0] === '-') {
    var data = '';
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (chunk) {
      data += chunk;
    });
    process.stdin.on('end', function () {
      gen({'stdin': data});
    });
  } else {
    files.forEach(function (filename) {
      sources[filename] = fs.readFileSync(filename, "utf8");
    });
    gen(sources);
  }
}

function gen (sources) {
  var result;
  if (opts.language.toUpperCase() === 'EJS') {
    result = jsxgettext.generateFromEJS(sources, opts);
  } else if (opts.language.toUpperCase() === 'JINJA') {
    result = jsxgettext.generateFromJinja(sources, opts);
  } else if (opts.language.toUpperCase() === 'JADE') {
    result = jsxgettext.generateFromJade(sources, opts);
  } else if (opts.language.toUpperCase() === 'HANDLEBARS') {
    result = jsxgettext.generateFromHandlebars(sources, opts);
  } else {
    result = jsxgettext.generate(sources, opts);
  }
  if (opts.output === '-') {
    console.log(result);
  } else {
    fs.writeFileSync(path.resolve(path.join(opts['output-dir'] || '', opts.output)), result, "utf8");
  }
}

main();
