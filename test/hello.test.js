var assert = require('assert'),
  fs = require('fs'),
  child_process = require('child_process'),
  lone = require('../');

describe('hello', function(){
  var config = {
    src: __dirname + '/fixtures/hello'
  };

  it('should create a manifest', function(done){
    lone.manifest(config, function(err, res){
      if(err) return done(err);

      config = res;
      assert.deepEqual(config.manifest.files, ['index.js', 'package.json']);
      done();
    });
  });

  it('should create a zip file', function(done){
    lone.zip(config, function(err, config){
      if(err) return done(err);

      assert(fs.existsSync(config.bundle));

      done();
    });
  });

  it('should deliver a runnable executable', function(done){
    lone(config, function(err, res){
      if(err) return done(err);

      config = res;
      child_process.exec(config.out, function(err, stdout){
        if(err) return done(err);
        assert.equal(stdout.toString().replace('\n', ''), 'hello');
        done();
      });
    });
  });
});
