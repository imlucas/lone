"use strict";

var derp = require('./derp'),
  glob = require('glob'),
  fs = require('fs'),
  AdmZip = require('../embed/admzip'),
  Minimatch = require('minimatch').Minimatch,
  async = require('async'),
  assert = require('assert');

module.exports = function bundle(config, fn){
  // run npm install
  // create manifest
  // create zip and add all files to it
  // write zip to config.out
  derp.sync(config, derp.run('npm install', config.src),
    module.exports.manifest, module.exports.zip, fn);
};

module.exports.manifest = function bundle_manifest(config, fn){
  var debug = require('debug')('lone:bundle:manifest'),
    manifest = {files: [], directories: []},
    ignore = [];

  // Already ran the manifest
  if(config.manifest) return fn(null, config);

  function addIgnore(pattern){
    debug('ignore', pattern);
    ignore.push(new Minimatch(pattern, {matchBase: true, dot: true, flipNegate: true}));
  }

  [
    '{.DS_Store,.git,npm-debug.log}',
    config.app.name + '.zip',
    '.dist/',
    './**/{test,tst,examples,example,tools,man,doc,docs}/**'
  ].map(addIgnore);

  glob('{./*,./**/*}', {cwd: config.src, mark: true}, function (err, files){
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
    debug('# files', config.manifest.files.length);

    fn(null, config);
  });
};

module.exports.zip = function bundle_zip(config, fn){
  var zip = new AdmZip(),
    debug = require('debug')('lone:bundle:zip');

  debug('reading files');

  async.parallel(config.manifest.files.map(function(p){
    return function(cb){
      fs.readFile(config.src + '/' + p, 'utf-8', function(err, data){
        if(err) return cb(err);
        zip.addFile(p, data);
        debug('added', derp.relativity(p));
        cb(null);
      });
    };
  }), function(err, res){
    if(err) return fn(err);
    debug('writing', derp.relativity(config.bundle));
    zip.writeZip(config.bundle);

    fn(null, config);
  });
};
