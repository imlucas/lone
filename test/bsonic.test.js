var assert = require('assert'),
  child_process = require('child_process'),
  lone = require('../'),
  path = require('path'),
  debug = require('debug')('lone:test:bsonic');

describe('bsonic', function(){
  after(path.remove.bind(null, path._additions));

  it('should deliver a runnable executable', function(done){
    lone({src: __dirname + '/fixtures/bsonic', node: '0.10.28'}, function(err, res){
      assert.ifError(err);
      child_process.exec(res.out, {env: {decode: 'DwAAABBsb25lAAEAAAAA'}}, function(err, stdout, stderr){
        debug('stderr', stderr.toString());
        debug('stdout', stdout.toString());
        assert.ifError(err);
        assert.equal(stdout.toString(), '{ lone: 1 }\n');
        done();
      });
    });
  });
});
