# jsxgettext [![Build Status](https://travis-ci.org/zaach/jsxgettext.png)](https://travis-ci.org/zaach/jsxgettext) [![NPM version](https://badge.fury.io/js/jsxgettext.png)](http://badge.fury.io/js/jsxgettext)

A node module with a CLI that extracts gettext strings from JavaScript, EJS, Jade, Jinja, Swig and Handlebars files. Uses a real parser, [acorn](https://github.com/marijnh/acorn), for JavaScript files and recognizes the following uses:

```javascript
gettext("Hello world!");
gettext("Hello " + 'world!');
myModule.gettext("Hello " + 'world!');
gettext.call(myObj, "Hello " + 'world!');
ngettext("Here's an apple for you", "Here are %s apples for you", 3);
ngettext("Here's an apple" + ' for you', "Here are %s apples" + ' for you', 3);
myModule.ngettext("Here's an apple" + ' for you', "Here are %s apples" + ' for you', 3);
ngettext.call(myObj, "Here's an apple" + ' for you', "Here are %s apples" + ' for you', 3);
```

It also extracts comments that begin with "L10n:" when they appear above or next to a `gettext` call:

```javascript
// L10n: Don't forget the exclamation mark
gettext("Hello world!");  // L10n: Salutation to the world  
```

"L10n:" is a default value and you can change it with `-c` option.

## Install

    npm install jsxgettext

Or from source:

    git clone https://github.com/zaach/jsxgettext.git
    cd jsxgettext
    npm link

## Use

    $ jsxgettext


    Usage: jsxgettext [options] [file ...]
  
    Options:
  
      -h, --help                      output usage information
      -V, --version                   output the version number
      -o, --output <file>             write output to specified <file>
      -p, --output-dir <path>         output files will be placed in directory <path>
      -k, --keyword [keywords]        additional keywords to be looked for
      -j, --join-existing             join messages with existing file
      -L, --language [lang]           use the specified language (javascript, ejs, jinja, handlebars, jade, swig) [javascript]
      -s, --sanity                    sanity check during the extraction
      --project-id-version [version]  This is the project name and version of the generated package/catalog.
      --report-bugs-to [bug address]  An email address or URL where you can report bugs in the untranslated strings.
      -c, --add-comments [tag]        place comment blocks starting with TAG and preceding keyword lines in output file (default: "L10n:").