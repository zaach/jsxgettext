var fs         = require('fs');
var path       = require('path');
var jsxgettext = require('./jsxgettext');


function main (args) {
  var filename = args[2];
  var source   = fs.readFileSync(filename, "utf8");
  var ext = path.extname(filename);
  var result;

  if (filename.indexOf('.ejs') >= 0) {
    result = jsxgettext.generateFromEJS(source, filename);
  } else {
    result = jsxgettext.generate(source, filename);
  }
  console.log(result);
}

main(process.argv);
