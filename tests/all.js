// TODO figure out why 
// exports['test join_existing'] = require('./join_existing');
// doesn't work
exports['test join_existing'] = require('./join_existing')['we gettext from first file'];

if (module == require.main) {
  require('test').run(exports);
} else {
    console.log("Just a module");
}


