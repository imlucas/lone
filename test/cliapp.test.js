var assert = require('assert');
var helpers = require('../helpers');
var compile = helpers.compileFixture;
var run = helpers.runFixtureBinary;

describe('cliapp', function() {
  after(helpers.after);
  it('should compile', function(done) {
    compile('cliapp', done);
  });

  it('should show help when `./cliapp help` is run', function(done) {
    run('cliapp', ['help'], function(err, stdout, stderr) {
      assert.ifError(err);
      assert(stderr.toString().indexOf('argv { _: [ \'help\' ]') === 0,
        'argv._[0] not `help`: ' + stderr.toString());
      done();
    });
  });

  it('should show help when `./cliapp --help` is run', function(done) {
    run('cliapp', ['--help'], function(err, stdout) {
      assert.ifError(err);
      assert(stdout.toString().indexOf('Usage: node') === -1,
        'nodejs intercepted help argv.  compile#argvPatch failed :/');
      done();
    });
  });

  it('should show help when `./cliapp -h` is run', function(done) {
    run('cliapp', ['--help'], function(err, stdout) {
      assert.ifError(err);
      assert(stdout.toString().indexOf('Usage: node') === -1,
        'nodejs intercepted help argv.  compile#argvPatch failed :/');
      done();
    });
  });
});
