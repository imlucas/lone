"use strict";

var path = require('path'),
  assert = require('assert'),
  os = require('os'),
  fs = require('fs-extra'),
  child_process = require('child_process'),
  lone = require('../'),
  debug = require('debug')('lone:test:bsonic');

describe('bsonic', function(){
  var config = {
    src: __dirname + '/fixtures/bsonic',
    cache: __dirname + '/.lone'
  };

  before(function(done){
    fs.removeSync(path.join(os.tmpDir(), 'bsonic'));
    lone.configure(config)(function(err, data){
      if(err) return done(err);

      config = data;
      done();
    });
  });

  after(function(){
    // fs.removeSync(config.bundle);
    // fs.removeSync(config.out);
  });

  it('should create a manifest', function(done){
    lone.bundle.manifest(config, function(err, res){
      if(err) return done(err);

      config = res;
      assert(config.manifest.files.length < 150);
      done();
    });
  });

  it('should create a zip file', function(done){
    lone.zip(config, function(err, res){
      if(err) return done(err);
      config = res;
      assert(fs.existsSync(config.bundle));

      done();
    });
  });

  it('should deliver a runnable executable', function(done){
    lone.compile(config, function(err, res){
      if(err) return done(err);

      config = res;
      child_process.exec(config.out, function(out, stdout, stderr){
        if(err) return done(err);
        if(stderr.toString().length > 0){
          return done(new Error(stderr.toString()));
        }
        assert.equal(stdout.toString(), 'DwAAABBsb25lAAEAAAAA\n');

        // child_process.exec(config.out + ' DwAAABBsb25lAAEAAAAA', function(out, stdout, stderr){
        //   if(err) return done(err);

        //   assert.equal(stdout.toString(), '{ lone: 1 }\n');
          done();
        });
      // });
    });
  });
});
