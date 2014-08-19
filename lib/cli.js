#!/usr/bin/env node
"use strict";

var fs         = require('fs');
var path       = require('path');
var parsers    = require('./parsers');
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
    callback: function () {
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
    list: true,
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
    default: 'javascript',
    help: 'use the specified language (' + ['javascript'].concat(Object.keys(parsers)).join(', ') + ')'
  })
  .option('sanity', {
    abbr: 's',
    flag: true,
    help: "sanity check during the extraction"
  })
  .option('support-module', {
    metavar: 'SUPPORTMODULE',
    help: 'Specific parsers (e.g. swig) need a custom module to be imported. Specify it with this argument.'
  })
  .option('project-id-version', {
    metavar: '"PACKAGE VERSION"',
    help: 'This is the project name and version of the generated package/catalog.'
  })
  .option('report-bugs-to', {
    metavar: 'EMAIL',
    help: 'An email address or URL where you can report bugs in the untranslated strings.'
  })
  .option('add-comments', {
    abbr: 'c',
    metavar: 'TAG',
    help: 'place comment blocks starting with TAG and preceding keyword lines in output file (default: "L10n:").'
  })
  .parse();

function gen(sources) {
  var result;
  var lang = opts.language.toLowerCase();
  if (!opts.keyword) {
    opts.keyword = ['gettext'];
  }
  if (opts.keyword.indexOf('gettext') === -1) {
    // when called from the cli, gettext should always be one of the default keywords
    opts.keyword.push('gettext');
  }

  if (lang === 'javascript') {
    result = jsxgettext.generate(sources, opts);
  } else if (lang in parsers) {
    result = jsxgettext.generate.apply(jsxgettext, parsers[lang](sources, opts));
  } else {
    throw new Error("Unsupported language: " + opts.language);
  }

  if (opts.output === '-') {
    console.log(result);
  } else {
    fs.writeFileSync(path.resolve(path.join(opts['output-dir'] || '', opts.output)), result, "utf8");
  }
}

function main() {
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

main();
