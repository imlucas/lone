var derp = require('./derp'),
  glob = require('glob'),
  fs = require('fs'),
  path = require('path'),
  JSZip = require('jszip'),
  Minimatch = require('minimatch').Minimatch,
  isWindows = require('os').platform() === 'win32',
  async = require('async');

module.exports = function bundle(config, fn){
  // run npm install
  // create manifest
  // create zip and add all files to it
  // write zip to config.out
  derp.sync(config,
    // derp.run('npm install', config.src),
    module.exports.manifest, module.exports.patch, module.exports.zip, fn);
};

module.exports.patch = function(config, fn){
  var debug = require('debug')('lone:bundle:patch'),
    DiffMatchPatch = require('diff-match-patch'),
    dmp = new DiffMatchPatch();

  if(!isWindows){
    debug('not windows.  dont need to patch');
    return fn(null, config);
  }

  [
    [
      path.resolve(config.src + '/node_modules/bson/ext/index.js'),
      path.resolve(__dirname + '/../patch/bson.patch')
    ],
    [
      path.resolve(config.src + '/node_modules/mongodb/node_modules/kerberos/index.js'),
      path.resolve(__dirname + '/../patch/kerberos.patch')
    ]
  ].map(function(item){
    if(!fs.existsSync(item[0])){
      return debug('dont need to patch', item[0]);
    }
    debug('applying', item[0], item[1]);
    var src = item[0],
      patch = fs.readFileSync(item[1], 'utf-8'),
      p, fresh;
    if(isWindows){
      patch = patch.replace(/\r/g, '');
    }
    p = dmp.patch_fromText(patch);

    fresh = dmp.patch_apply(p,
      fs.readFileSync(src, 'utf-8'));

    debug('fresh', fresh[0]);
    fs.writeFileSync(src, fresh[0]);
  });

  debug('complete');
  return fn(null, config);
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

  async.parallelLimit(config.manifest.files.map(function(p){
    return function(cb){
      fs.readFile(config.src + '/' + p, function(err, data){
        if(err) return cb(err);

        zip.file(p, data);
        debug('added', derp.relativity(p));
        cb(null);
      });
    };
  }), 100, function(err){
    if(err) return fn(err);
    debug('writing', derp.relativity(config.bundle));
    fs.writeFile(config.bundle, zip.generate({type:'nodebuffer'}), function(err){
      if(err) return fn(err);
      fn(null, config);
    });
  });
};
