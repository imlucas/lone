"use strict";

var derp = require('./derp'),
  glob = require('glob'),
  fs = require('fs'),
  AdmZip = require('../embed/adm-zip'),
  Minimatch = require('minimatch').Minimatch,
  async = require('async'),
  debug = require('debug')('lone:bundle');

module.exports = function(config, fn){
  // run npm install
  // create manifest
  // create zip and add all files to it
  // write zip to config.out
    derp.sync(config, derp.run('npm install', config.src),
      module.exports.manifest, module.exports.zip, fn);
};

module.exports.manifest = function(config, fn){
  var manifest = {files: [], directories: []},
    ignore = [],
    devPackageNames = Object.keys(config.app.devDependencies || {});

  function addIgnore(pattern){
    debug('ignore', pattern);
    ignore.push(new Minimatch(pattern, {matchBase: true, dot: true, flipNegate: true}));
  }

  debug('manifesting', config.src);
  [
    '{.DS_Store,.git,npm-debug.log}',
    '**/{test,tst,examples,example,tools,man,doc,docs,' + devPackageNames.join(',') + '}/**',
  ].map(addIgnore);
  // if(devPackageNames.length > 0){
  //   addIgnore('node_modules/{' + devPackageNames.join(',') + '}/**');
  // }

  glob('**/*', {cwd: config.src, mark: true}, function (err, files){
    if(err) return fn(err);

    manifest.files = files.filter(function(p){
      return !ignore.some(function(i){
        return i.match(p);
      });
    }).filter(function(p){
      if(p.charAt(p.length - 1) === '/'){
        manifest.directories.push(p);
        return false;
      }
      return true;
    });
    config.manifest = manifest;
    debug('manifest contains', config.manifest.files.length + ' files');

    fn(null, config);
  });
};

module.exports.zip = function(config, fn){
  var zip = new AdmZip();
  debug('zipping up', config.manifest.files.length + ' files');
  async.parallel(config.manifest.files.map(function(p){
    return function(cb){
      fs.readFile(config.src + '/' + p, 'utf-8', function(err, data){
        if(err) return cb(err);
        zip.addFile(p, data);
      });
    };
  }), function(err, res){
    if(err) return fn(err);

    zip.writeZip(config.app.bundle);

    fn(null, config);
  });
};
