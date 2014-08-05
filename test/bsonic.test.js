var assert = require('assert'),
  child_process = require('child_process'),
  lone = require('../');

describe('bsonic', function(){
  var config = {
    src: __dirname + '/fixtures/bsonic',
    node: '0.10.29'
  };

  before(function(done){
    child_process.exec('npm install', {cwd: config.src}, function(){
      done();
    });
  });

  it('should deliver a runnable executable', function(done){
    lone(config, function(err, res){
      if(err) return done(err);

      config = res;
      child_process.exec(config.out, {env: {decode: 'DwAAABBsb25lAAEAAAAA'}}, function(err, stdout){
        if(err) return done(err);

        assert.equal(stdout.toString(), '{ lone: 1 }\n');
        done();
      });
    });
  });
});
