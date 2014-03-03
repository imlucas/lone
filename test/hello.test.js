"use strict";

var path = require('path'),
  assert = require('assert'),
  fs = require('fs'),
  lone = require('../'),
  derp = require('../lib/derp'),
  debug = require('debug')('lone:test:hello');

describe('hello', function(){
  var config = {src: __dirname + '/fixtures/hello'};

  before(function(done){
    lone.configure(config)(function(err, data){
      if(err) return done(err);

      config = data;
      done();
    });
  });

  it('should create a manifest', function(done){
    lone.bundle.manifest(config, function(err, res){
      if(err) return done(err);

      config = res;
      assert.deepEqual(config.manifest.files, ['./index.js', './package.json']);
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
    lone.compile(config, function(err, res){
      if(err) return done(err);

      done();
    });
  });
});
