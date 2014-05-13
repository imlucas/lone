var fs = require('fs-extra'),
  request = require('request'),
  tar = require('tar'),
  os = require('os'),
  isWindows = os.platform() === 'win32',
  zlib = require('zlib'),
  derp = require('./derp');

// get node source, extract it and embed files for lone.
module.exports = function(config, fn){
  derp.sync(config, module.exports.download, module.exports.extract,
    module.exports.embed, module.exports.make, module.exports.deliver, fn);
};

module.exports.download = function(config, fn){
  var debug = require('debug')('lone:compile:download');

  fs.exists(config.node.dest, function(exists){
    if(exists){
      debug('already have', config.node.version);
      return fn(null, config);
    }

    debug('fetching', config.node.url);
    var out = fs.createWriteStream(config.node.dest).on('error', fn)
      .on('finish', function(){
        debug('saved', config.node.dest);
        fn(null, config);
      }),
      req = request(config.node.url);

    req.pipe(out);
    req.on('error', fn);
  });
};

module.exports.extract = function(config, fn){
  var debug = require('debug')('lone:compile:extract'),
    ungzip, input, extractor;

  fs.exists(config.node.working, function(exists){
    if(exists){
      debug('already extracted', config.node.working);
      return fn(null, config);
    }

    debug('reading...', config.node.dest);
    input = fs.createReadStream(config.node.dest);
    ungzip = zlib.createGunzip();
    extractor = tar.Extract({path: config.cache});

    extractor.on('end', function(){
      debug('created', config.node.working);
      fn(null, config);
    });

    debug('ungzip-ing...');
    input.pipe(ungzip);
    ungzip.on('error', function(err){
      debug('error ungziping', err);
      throw err;
    }).on('finished', function(){
      debug('ungzipped');
    });

    debug('untar-ing....');
    ungzip.pipe(extractor);
  });
};

module.exports.embed = function(config, fn){
  var debug = require('debug')('lone:compile:embed'),
    gyp = config.node.working + '/node.gyp';

  function copier(src, dest){
    return function(cb){
      fs.copy(src, dest, cb);
    };
  }

  function writer(dest, contents){
    return function(cb){
      fs.writeFile(dest, contents, cb);
    };
  }

  debug('checking node.gyp patches');
  fs.readFile(gyp, function(err, data){
    if(err) return fn(err);

    var src = data.toString(),
      tasks = [], embeds;

    if(src.indexOf('lib/_third_party_main') > -1){
      debug('already patched node.gyp');
      return fn(null, config);
    }

    embeds = ['_third_party_main', 'admzip'].map(function(name){
      tasks.push(copier(__dirname + '/../embed/' + name + '.js',
        config.node.working + '/lib/' + name + '.js'));
      return "      'lib/" + name + ".js'";
    }).join(',\n');

    tasks.push(writer(gyp, src.replace("'lib/zlib.js',",
      "'lib/zlib.js',\n" + embeds)));

    debug('embedding lone js files');
    derp(config, tasks, fn);
  });
};

module.exports.deliver = function(config, fn){
  var debug = require('debug')('lone:compile:deliver');
  debug('copy node to', config.out);
  fs.copy(config.node.out, config.out, function(err){
    if(err) return fn(err);

    debug('combining with bundle');
    derp.cat(config.node.out, config.bundle, config.out)(config, function(err){
      fs.unlink(config.node.out, function(){
        debug('party');
        fn(err, config);
      });
    });
  });
};

module.exports.make = function(config, fn){
  var debug = require('debug')('lone:compile:make');
  fs.exists(config.node.out, function(exists){
    if(exists){
      debug('already have', config.node.out);
      return fn(null, config);
    }
    debug('building node from source...', 'go get a coffee!');
    debug('node will be built to', config.node.out);
    if(isWindows){
      return derp.sync(config,
        derp.run('cmd /c vcbuild.bat nosign release x64', config.node.working),
        function(err, config){
          if(err) return fn(err);
          debug('baked', derp.relativity(config.node.out));
          return fn(err, config);
        });
    }


    derp.sync(config,
      derp.run('./configure', config.node.working),
      derp.run('make --quiet', config.node.working),
      function(err, config){
        if(err) return fn(err);

        debug('baked', derp.relativity(config.node.out));

        if(!config.strip){
          return fn(err, config);
        }

        fs.exists('/usr/bin/strip', function(exists){
          if(!exists) return fn(err, config);

          derp.run('/usr/bin/strip ' + config.node.out)(config, function(err, config){
            debug('stripped', derp.relativity(config.node.out));
            fn(err, config);
          });
        });
      });
  });
};
