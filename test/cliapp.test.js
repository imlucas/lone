var assert = require('assert'),
  child_process = require('child_process'),
  lone = require('../'),
  path = require('path'),
  debug = require('debug')('lone:test:cliapp');

describe('cliapp', function(){
  var bin;

  after(path.remove.bind(null, path._additions));
  it('should deliver a runnable executable', function(done){
    lone({cache: __dirname + '/.lone', node: 'unstable', src: __dirname + '/fixtures/cliapp'}, function(err, res){
      assert.ifError(err);
      bin = res.out;

      var cmd = bin;
      debug('run:', cmd);
      child_process.exec(cmd, function(err, stdout, stderr){
        debug('stdout:', stdout.toString());
        debug('stderr:', stderr.toString());
        debug('err: ', err);
        assert.ifError(err);
        done();
      });
    });
  });
  it('should show help when `./cliapp help` is run', function(done){
    var cmd = bin + ' help';
    debug('run:', cmd);
    child_process.exec(cmd, function(err, stdout, stderr){
      debug('stdout:', stdout.toString());
      debug('stderr:', stderr.toString());
      debug('err: ', err);
      assert.ifError(err);
      assert(stderr.toString().indexOf('argv { _: [ \'help\' ]') === 0, 'argv._[0] not `help`: ' + stderr.toString());
      done();
    });
  });

  it('should show help when `./cliapp --help` is run', function(done){
    var cmd = bin + ' --help';
    debug('run:', cmd);
    child_process.exec(cmd, function(err, stdout, stderr){
      debug('stdout:', stdout.toString());
      debug('stderr:', stderr.toString());
      debug('err: ', err);
      assert.ifError(err);
      assert(stdout.toString().indexOf('Usage: node') === -1, 'nodejs intercepted help argv');
      done();
    });
  });

  it('should show help when `./cliapp -h` is run', function(done){
    var cmd = bin + ' -h';
    debug('run:', cmd);
    child_process.exec(cmd, function(err, stdout, stderr){
      debug('stdout:', stdout.toString());
      debug('stderr:', stderr.toString());
      debug('err: ', err);
      assert.ifError(err);
      assert(stdout.toString().indexOf('Usage: node') === -1, 'nodejs intercepted help argc');
      done();
    });
  });
});
