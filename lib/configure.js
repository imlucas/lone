var fs = require('fs-extra'),
  path = require('path'),
  extend = require('extend'),
  os = require('os'),
  async = require('async'),
  options = require('./options'),
  config = require('./config'),
  untildify = require('untildify'),
  resolveNodeVersion = require('resolve-node-version'),
  debug = require('debug')('lone:configure');

// @todo: add to @imlucas/path-extra module
path.bin = function(bin){
  var p = path.resolve(bin);
  if(os.platform() === 'win32') p += '.exe';
  return p;
};

path._additions = [];

path.contains = function(p){
  var _paths = process.env.PATH.split(path.delimiter);
  return _paths.indexOf(p) > -1;
};

path.add = function(p){
  if(Array.isArray(p)) return p.map(path.add);

  if(path.contains(p)) return false;

  process.env.PATH = p + path.delimiter + process.env.PATH;
  path._additions.push(p);
  return true;
};

path.remove = function(p){
  if(Array.isArray(p)) return p.map(path.remove);

  if(!path.contains(p)) return false;

  var _paths = process.env.PATH.split(path.delimiter);
  _paths.splice(_paths.indexOf(p), 1);
  process.env.PATH = _paths.join(path.delimiter);

  if(path._additions.indexOf(p)){
    path._additions.splice(path._additions.indexOf(p), 1);
  }
  return true;
};

// Build some config strings and make sure directories exist so we can build
// node from source and do a little validation on package.json.
module.exports = function(opts, fn){
  extend(true, config, {
    cache: path.resolve(untildify(opts.cache || options.cache.default)),
    src: path.resolve(untildify(opts.src || process.cwd())),
    ignore: config.ignore || []
  });
  config.node = {};

  if(!Array.isArray(config.ignore)) config.ignore = [config.ignore];

  resolveNodeVersion((opts.node || options.node.default), function(err, version){

    var basename = 'node-v' + version;

    extend(true, config.node, {
      version: version,
      filename: basename + '.tar.gz',
      url: 'http://nodejs.org/dist/latest/' + basename + '.tar.gz',
      dest: path.resolve(config.cache + '/source/' + basename + '.tar.gz'),
      working: path.resolve(config.cache + '/' + basename),
      out: path.bin(config.cache + '/' + basename + '/out/Release/node')
    });

    path.add(path.resolve(config.cache + '/' + basename + '/deps/npm/bin'));
    path.add(path.resolve(config.cache + '/' + basename + '/deps/npm/bin/node-gyp-bin'));

    config.app = {
      name: '',
      bin: {},
      dependencies: {},
      devDependencies: {}
    };

    fs.readFile(config.src + '/package.json', function(err, data){
      if(err) return fn(new Error('typo or no package.json for your app? looked in: ' + config.src));

      var pkg = JSON.parse(data);

      if(!pkg.bin || !pkg.bin[pkg.name]){
        pkg.bin = {};
        pkg.bin[pkg.name] = 'bin/' + pkg.name +'.js';

        fs.mkdirsSync(config.src + '/bin');
        fs.writeFileSync(config.src + '/bin/' + pkg.name +'.js',
          "require(__dirname + '/../" + (pkg.main || 'index.js') + "')");

        fs.writeFileSync(config.src + '/package.json',
          JSON.stringify(pkg, null, 2));

        debug('added ');
      }

      config.out = path.resolve(config.src + '/.lone/dist/' + pkg.name);
      config.bundle = path.resolve(config.src + '/.lone/build/' + pkg.name + '.zip');
      config.app.bin = path.bin(path.resolve(config.src, pkg.bin[pkg.name]));

      config.icon = (pkg.lone && pkg.lone.icon) ? path.resolve(config.src, pkg.lone.icon) : null;

      ['name', 'dependencies', 'devDependencies', 'version', 'author', 'description'].map(function(key){
        if(pkg[key]) config.app[key] = pkg[key];
      });

      if(config.app.devDependencies){
        Object.keys(config.app.devDependencies).map(function(name){
          config.ignore.push(path.resolve(config.src + '/node_modules/' + name + '/**'));
        });
      }

      fs.exists(config.app.bin, function(exists){
        if(!exists) return fn(new Error(config.app.bin + ' does not exist'));

        debug('configured', config.app.name);
        debug('- out', config.out);
        debug('- src', config.src);
        debug('- bundle', config.bundle);
        debug('- ignore', config.ignore);
        debug('- node', config.node);
        debug('- app', config.app);

        async.parallel([config.out, config.bundle, config.node.dest].map(function(p){
          return fs.mkdirs.bind(null, path.dirname(p));
        }), fn);
      });
    });
  });
};
