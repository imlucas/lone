var derp = require('./derp'),
  glob = require('glob'),
  fs = require('fs'),
  JSZip = require('jszip'),
  Minimatch = require('minimatch').Minimatch,
  async = require('async');

module.exports = function bundle(config, fn){
  // run npm install
  // create manifest
  // create zip and add all files to it
  // write zip to config.out
  derp.sync(config,
    // derp.run('npm install', config.src),
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
    ignore.push(new Minimatch(pattern, {flipNegate: true}));
  }
  config.ignore.push.apply(config.ignore, ['node_modules/lone/**']);

  config.ignore.map(addIgnore);
  glob('{*,**/*}', {cwd: config.src, root: config.src, mark: true, strict: true}, function (err, files){
    if(err) return fn(err);

    manifest.files = files.filter(function(p){
      var gIgnore = ignore.some(function(i){
        return i.match(p);
      });

      if(gIgnore === true) return false;
      if(p.charAt(p.length - 1) === '/'){
        manifest.directories.push(p);
        return false;
      }
      return true;
    });
    config.manifest = manifest;
    debug('files collected', config.manifest.files.length);

    fn(null, config);
  });
};

module.exports.zip = function bundle_zip(config, fn){
  var zip = new JSZip(null, {type: 'nodebuffer'}),
    debug = require('debug')('lone:bundle:zip');

  debug('reading files');

  async.parallel(config.manifest.files.map(function(p){
    return function(cb){
      fs.readFile(config.src + '/' + p, function(err, data){
        if(err) return cb(err);

        zip.file(p, data);
        debug('added', derp.relativity(p));
        cb(null);
      });
    };
  }), function(err){
    if(err) return fn(err);
    debug('writing', derp.relativity(config.bundle));
    fs.writeFile(config.bundle, zip.generate({type:'nodebuffer'}), function(err){
      if(err) return fn(err);
      fn(null, config);
    });
  });
};
