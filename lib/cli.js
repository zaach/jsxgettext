#!/usr/bin/env node
"use strict";

var fs         = require('fs');
var path       = require('path');
var parsers    = require('./parsers');
var jsxgettext = require('./jsxgettext');

var optAsList = function (val) { return val.split(','); };
var opts = require("commander")
  .version(require('../package.json').version)
  .usage('[options] [file ...]')
  .option('-o, --output <file>', 'write output to specified <file>', '-')  // default to stdout
  .option('-p, --output-dir <path>', 'output files will be placed in directory <path>')
  .option('-k, --keyword [keywords]', 'additional keywords to be looked for', optAsList)
  .option('-j, --join-existing', 'join messages with existing file')
  .option('-L, --language [lang]', 'use the specified language (' + ['javascript'].concat(Object.keys(parsers)).join(', ') + ') [javascript]', 'javascript')
  .option('-s, --sanity', "sanity check during the extraction")
  .option('--project-id-version [version]', 'This is the project name and version of the generated package/catalog.')
  .option('--report-bugs-to [bug address]', 'An email address or URL where you can report bugs in the untranslated strings.')
  .option('-c, --add-comments [tag]', 'place comment blocks starting with TAG and preceding keyword lines in output file (default: "L10n:").')
  .parse(process.argv);

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

  if (opts.output === '-') {  // use stdout
    console.log(result);
  } else {
    fs.writeFileSync(
      path.resolve(path.join(opts.outputDir || '', opts.output)),
      result,
      "utf8"
    );
  }
}

function main() {
  var files = opts.args;
  var sources = {};

  if (!files.length || files[0] === '-') {  // read from stdin, and do it by default
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
