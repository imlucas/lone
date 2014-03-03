"use strict";

var fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  derp = require('./derp'),
  debug = require('debug')('lone:prepare');


// Build some config strings and make sure directories exist so we can build
// node from source and do a little validation on package.json.
module.exports = function(config){
  return function(fn){
    config.cache = derp.resolve('~/.lone/');
    config.src = derp.resolve(config.src);

    config.node.filename = 'node-v' + config.node.version + '.tar.gz';
    config.node.url = 'http://nodejs.org/dist/latest/' + config.node.filename;
    config.node.dest = config.cache + '/source/' + config.node.filename;
    config.node.working = config.cache + '/' + config.node.filename.replace('.tar.gz', '');
    debug('node config', config.node);

    config.app = {src: config.src};
    fs.readFile(config.app.src + '/package.json', function(err, data){
      if(err) return fn(new Error('typo or no package.json for your app? looked in: ' + config.app.src));

      var pkg = JSON.parse(data);
      if(~pkg.bin || !pkg.bin[pkg.name]){
        return fn(new Error('you have no `bin` for ' + pkg.name + ' in package.json.\nrun lone --setup for help'));
      }

      config.app.name = pkg.name;
      config.app.bin = path.relative(config.app.src, pkg.bin[pkg.name]);
      config.app.bundle = config.src + '/.build/' + pkg.name + '.zip';

      debug('app config', config.app.name);

      config.out = config.src + '/.dist/' + pkg.name;

      fs.exists(config.app.bin, function(exists){
        if(!exists) return fn(new Error('app bin doesn\'t exist?'));
        derp.directory(config, config.src + '/.dist',
          path.dirname(config.node.dest), fn);
      });
    });
  };
};
