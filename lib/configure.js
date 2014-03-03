"use strict";

var fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  derp = require('./derp'),
  options = require('./options'),
  debug = require('debug')('lone:prepare');


// Build some config strings and make sure directories exist so we can build
// node from source and do a little validation on package.json.
module.exports = function(config){
  return function(fn){
    config.node = config.node || {version: options.node.default};

    var filename = 'node-v' + config.node.version + '.tar.gz';

    derp.extend(config, {
      cache: derp.resolve(options.cache.default),
      src: derp.resolve(config.src)
    });

    derp.extend(config.node, {
      filename: filename,
      url: 'http://nodejs.org/dist/latest/' + filename,
      dest: config.cache + '/source/' + filename,
      working: config.cache + '/' + filename.replace('.tar.gz', '')
    });

    config.app = {
      name: null,
      bin: null,
      bundle: null,
      dependencies: {},
      devDependencies: {}
    };

    fs.readFile(config.src + '/package.json', function(err, data){
      if(err) return fn(new Error('typo or no package.json for your app? looked in: ' + config.app.src));

      var pkg = JSON.parse(data);
      if(!pkg.bin || !pkg.bin[pkg.name]){
        return fn(new Error('you have no `bin` for ' + pkg.name + ' in package.json.\nrun lone --setup for help'));
      }

      config.out = config.src + '/.dist/' + pkg.name;

      derp.extend(config.app, {
        bin: path.relative(config.src, pkg.bin[pkg.name]),
        bundle: config.src + '/.build/' + pkg.name + '.zip'
      });

      ['name', 'dependencies', 'devDependencies'].map(function(key){
        config.app[key] = pkg[key];
      });

      fs.exists(config.app.bin, function(exists){
        if(!exists) return fn(new Error('app bin doesn\'t exist?'));

        debug('config', config);

        derp.directory(config, config.src + '/.dist',
          path.dirname(config.node.dest), fn);
      });
    });
  };
};
