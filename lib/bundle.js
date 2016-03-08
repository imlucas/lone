var glob = require('glob');
var fs = require('fs');
var config = require('./config');
var JSZip = require('jszip');
var which = require('which');
var createRunner = require('./runner');
var Minimatch = require('minimatch').Minimatch;
var async = require('async');

function createManifest(fn) {
  var debug = require('debug')('lone:bundle:manifest');
  var manifest = {
    files: [],
    directories: []
  };
  var ignore = [];

  // Already ran the manifest
  if (config.manifest) {
    return fn();
  }

  function addIgnore(pattern) {
    pattern = pattern.replace(config.src + '/', '');
    debug('ignore', pattern);
    ignore.push(new Minimatch(pattern, {
      flipNegate: true
    }));
  }
  config.ignore.push.apply(config.ignore, ['node_modules/lone/**']);

  config.ignore.map(addIgnore);
  glob('{*,**/*}', {
    cwd: config.src,
    root: config.src,
    mark: true,
    strict: true
  }, function(err, files) {
    if (err) {
      return fn(err);
    }

    manifest.files = files.filter(function(p) {
      var gIgnore = ignore.some(function(i) {
        return i.match(p);
      });

      if (gIgnore === true) {
        return false;
      }
      if (p.charAt(p.length - 1) === '/') {
        manifest.directories.push(p);
        return false;
      }
      return true;
    });

    config.manifest = manifest;
    debug('files collected', config.manifest.files.length);
    fn();
  });
}

function createZip(fn) {
  var zip = new JSZip(null, {
    type: 'nodebuffer'
  });
  var debug = require('debug')('lone:bundle:zip');

  debug('reading files');

  async.parallelLimit(config.manifest.files.map(function(p) {
    return function(cb) {
      fs.readFile(config.src + '/' + p, function(err, data) {
        if (err) {
          return cb(err);
        }

        zip.file(p, data);
        cb(null);
      });
    };
  }), 100, function(err) {
    if (err) {
      return fn(err);
    }
    debug('writing', config.bundle);
    fs.writeFile(config.bundle, zip.generate({
      type: 'nodebuffer'
    }), fn);
  });
}

function install(fn) {
  var debug = require('debug')('lone:bundle:install');
  var cmd = config.node.out + ' ' + which.sync('npm-cli.js') + ' install --production';
  var run = createRunner(debug, config.src);
  debug('Installing dependencies...', cmd);
  debug('which node-gyp?', which.sync('node-gyp'));
  run(cmd)(fn);
}

module.exports = function(fn) {
  async.series([install, createManifest, createZip], fn);
};
