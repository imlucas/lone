"use strict";

var path = require('path'),
  assert = require('assert'),
  lone = require('../lib'),
  derp = require('../lib/derp');

describe('bundle', function(){
  var config = {};
  function configure(opts, fn){
    config = {};
    lone.configure(opts)(function(err, data){
      config = data;
      fn(err);
    });
  }

  it('should create a manifest', function(done){
    configure({src: path.resolve(__dirname + '/..')}, function(err){
      if(err) return done(err);

      lone.bundle.manifest(config, function(err){
        if(err) done(err);

        assert(config.manifest.directories.indexOf('node_modules/gulp/') === -1,
          'should not include devDependencies');
        done();
      });
    });
  });

  it('should create a zip file', function(done){
    configure({src: path.resolve(__dirname + '/..')}, function(err){
      if(err) return done(err);

      lone.bundle.manifest(config, function(err){
        if(err) return done(err);

        lone.bundle.zip(config, function(err){
          if(err) return done(err);
          done();
        });
      });
    });
  });
});
