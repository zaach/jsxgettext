// TODO figure out why 
// exports['test join_existing'] = require('./join_existing');
// doesn't work

exports.testAll = {};
exports.testAll['test creation date'] = require('./creation_date');
exports.testAll['test join_existing'] = require('./join_existing')['we gettext from first file'];
exports.testAll['test leading_hash'] = require('./leading_hash')['leading hash'];
exports.testAll['test second_attribute'] = require('./second_attribute')['test second attribute'];
exports.testAll['test jade'] = require('./jade');
exports.testAll['test ejs'] = require('./ejs');
exports.testAll['test handlebars'] = require('./handlebars');
exports.testAll['test comments'] = require('./test_comment');
exports.testAll['test po_quotes'] = require("./po_quotes");
exports.testAll['test expressions'] = require('./expressions');
exports.testAll['test anonymous_functions'] = require('./anonymous_functions');

if (module == require.main) {
  require('test').run(exports);
} else {
  console.log("Just a module");
}


