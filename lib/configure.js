var fs = require('fs'),
  path = require('path'),
  extend = require('extend'),
  os = require('os'),
  isWindows = os.platform() === 'win32',
  derp = require('./derp'),
  options = require('./options'),
  config = require('./config'),
  mkdirp = require('mkdirp'),
  debug = require('debug')('lone:configure');


// Build some config strings and make sure directories exist so we can build
// node from source and do a little validation on package.json.
module.exports = function(opts){
  return function configure(fn){
    config.node = {version: options.node.default};

    var filename = 'node-v' + config.node.version + '.tar.gz';

    extend(config, {
      cache: opts.cache || options.cache.default,
      src: config.src || process.cwd(),
      ignore: config.ignore || []
    });

    if(!Array.isArray(config.ignore)) config.ignore = [config.ignore];

    extend(config.node, {
      filename: filename,
      url: 'http://nodejs.org/dist/latest/' + filename,
      dest: path.resolve(config.cache + '/source/' + filename),
      working: path.resolve(config.cache + '/' + filename.replace('.tar.gz', ''))
    });

    if(isWindows){
      config.node.out = path.resolve(config.node.working + '/Release/node.exe');
    }
    else {
      config.node.out = path.resolve(config.node.working + '/out/Release/node');
    }
    config.app = {
      name: null,
      bin: null,
      dependencies: {},
      devDependencies: {}
    };

    fs.readFile(config.src + '/package.json', function(err, data){
      if(err) return fn(new Error('typo or no package.json for your app? looked in: ' + config.src));

      var pkg = JSON.parse(data);

      if(!pkg.bin || !pkg.bin[pkg.name]){
        pkg.bin = {};
        pkg.bin[pkg.name] = 'bin/' + pkg.name +'.js';

        mkdirp.sync(config.src + '/bin');
        fs.writeFileSync(config.src + '/bin/' + pkg.name +'.js',
          "require(__dirname + '/../" + (pkg.main || 'index.js') + "')");

        fs.writeFileSync(config.src + '/package.json',
          JSON.stringify(pkg, null, 2));

        debug('added ');
      }

      config.out = path.resolve(config.src + '/.lone/dist/' + pkg.name);
      config.bundle = path.resolve(config.src + '/.lone/build/' + pkg.name + '.zip');
      config.app.bin = derp.resolve(config.src, pkg.bin[pkg.name]);
      if(isWindows) config.out += '.exe';

      config.icon = (pkg.lone && pkg.lone.icon) ? path.resolve(config.src, pkg.lone.icon) : null;

      ['name', 'dependencies', 'devDependencies', 'version', 'author', 'description'].map(function(key){
        if(pkg[key]) config.app[key] = pkg[key];
      });

      fs.exists(config.app.bin, function(exists){
        if(!exists) return fn(new Error(config.app.bin + ' does not exist'));

        debug('configured', config.app.name);
        debug('- out', config.out);
        debug('- src', config.src);
        debug('- bundle', config.bundle);
        debug('- ignore', config.ignore);
        debug('- node', config.node);
        debug('- app', config.app);


        derp.directory(config, path.dirname(config.out),
          path.dirname(config.bundle),
          path.dirname(config.node.dest), fn);
      });
    });
  };
};
