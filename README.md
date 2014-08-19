# jsxgettext [![Build Status](https://travis-ci.org/zaach/jsxgettext.png)](https://travis-ci.org/zaach/jsxgettext) [![NPM version](https://badge.fury.io/js/jsxgettext.png)](http://badge.fury.io/js/jsxgettext)

A node module with a CLI that extracts gettext strings from JavaScript, EJS, Jade, Jinja, Swig and Handlebars files. Uses a real parser, [acorn](https://github.com/marijnh/acorn), for JavaScript files and recognizes the following uses:

```javascript
gettext("Hello world!");
gettext("Hello" + ' world!');
myModule.gettext("Hello " + 'world!');
gettext.call(myObj, "Hello " + 'world!');
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

    input argument is required

    Usage: jsxgettext <input>... [options]

    input     input files

    Options:
       -o FILE, --output FILE     write output to specified file
       -p DIR, --output-dir DIR   output files will be placed in directory DIR
       -v, --version              print version and exit
       -k WORD, --keyword WORD    additional keyword to be looked for
       -j, --join-existing        join messages with existing file
       -L NAME, --language NAME   use the specified language (javascript, ejs, jinja, handlebars, jade)
       -s, --sanity               sanity check during the extraction
       --support-module           Support module to require for specific language parsers

       --project-id-version "PACKAGE VERSION"   
       (po header) This is the project name and version of the generated package/catalog.

       --report-bugs-to EMAIL                   
       (po header) An email address or URL where you can report bugs in the untranslated strings.

       -c TAG, --add-comments TAG               place comment blocks starting with TAG and preceding keyword lines in output file (default: "L10n:").

### support-module
In order to be able to parse the templates, some language parsers need a custom
module to be imported which add tags to the parser instance.

#### Swig
For swig the support-module parameter is **required**. The module should have a function in
`module.exports` which allows the `swig` instance to be supplied.

##### Example:

```
// support module
var trans = require('./trans')
  , blocktrans = require('./blocktrans');

module.exports = function(swig) {
  swig.setTag("trans", trans.parse, trans.compile, trans.ends, trans.blockLevel);
  swig.setTag("blocktrans", blocktrans.parse, blocktrans.compile
              , blocktrans.ends, blocktrans.blockLevel);
};
```
