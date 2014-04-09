var fs = require('fs'),
  path = require('path'),
  derp = require('./derp'),
  options = require('./options'),
  debug = require('debug')('lone:configure');


// Build some config strings and make sure directories exist so we can build
// node from source and do a little validation on package.json.
module.exports = function(config){
  return function configure(fn){
    config.node = {version: options.node.default};

    var filename = 'node-v' + config.node.version + '.tar.gz';

    derp.extend(config, {
      cache: derp.resolve(config.cache || options.cache.default),
      src: derp.resolve(config.src || process.cwd()),
      ignore: config.ignore || []
    });

    if(!Array.isArray(config.ignore)) config.ignore = [config.ignore];

    derp.extend(config.node, {
      filename: filename,
      url: 'http://nodejs.org/dist/latest/' + filename,
      dest: config.cache + '/source/' + filename,
      working: config.cache + '/' + filename.replace('.tar.gz', '')
    });

    config.node.out = config.node.working + '/out/Release/node';

    config.app = {
      name: null,
      bin: null,
      dependencies: {},
      devDependencies: {}
    };

    fs.readFile(config.src + '/package.json', function(err, data){
      if(err) return fn(new Error('typo or no package.json for your app? looked in: ' + config.src));

      var pkg = JSON.parse(data);

      // @note: Yep this is pretty dogmatic, but the idea is have the same
      // experience with module, just running alone.  We want the user to have
      // the same experience whether they're running a standalone or installed
      // from npm.
      if(!pkg.bin || !pkg.bin[pkg.name]){
        return fn(new Error('you have no `bin` for ' + pkg.name + ' in package.json.\nrun lone --setup for help'));
      }

      config.out = config.src + '/.dist/' + pkg.name;
      config.bundle = config.src + '/.build/' + pkg.name + '.zip';

      config.app.bin = derp.resolve(config.src, pkg.bin[pkg.name]);

      ['name', 'dependencies', 'devDependencies'].map(function(key){
        if(pkg[key]){
          config.app[key] = pkg[key];
        }
      });

      fs.exists(config.app.bin, function(exists){
        if(!exists) return fn(new Error(config.app.bin + ' does not exist'));

        debug('configured', config.app.name);
        debug('- out', derp.relativity(config.out));
        debug('- src', derp.relativity(config.src));
        debug('- bundle', derp.relativity(config.bundle));
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
