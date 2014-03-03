"use strict";

var fs = require('fs'),
  request = require('request'),
  tar = require('tar'),
  derp = require('./derp'),
  debug = require('debug')('lone:source');

// get node source, extract it and embed files for lone.
module.exports = function(config, fn){
  derp.sync(config, module.exports.download, module.exports.extract,
    module.exports.embed, module.exports.make, fn);
};

module.exports.download = function(config, fn){
  fs.exists(config.node.dest, function(exists){
    if(exists){
      debug('already have source', config.node.dest);
      return fn(null, config);
    }
    debug('getting source', config.node.url);

    var out = fs.createWriteStream(config.node.dest)
      .on('error', fn)
      .on('close', function(){
        debug('downloaded to', config.node.dest);
        fn(null, config);
      }),
      req = request(config.node.url).on('error', fn);
    req.pipe(out);
  });
};

module.exports.extract = function(config, fn){
  var input = fs.createReadStream(config.node.dest).on('error', fn),
    extractor = tar.Extract({path: config.cache})
      .on('error', fn)
      .on('end', function(){
        fn(null, config);
      });

  input.pipe(extractor);
};

module.exports.embed = function(config, fn){
  var gyp = config.node.working + '/node.gyp';
  fs.readFile(gyp, function(err, data){
    if(err) return fn(err);

    var src = data.toString(),
      tasks = [function(cb){fs.writeFile(gyp, src, cb);}];

    if(src.indexOf('lib/_third_party_main') > -1){
      debug('already added to node.gyp');
      return fn(null, config);
    }

    src = src.replace("'lib/zlib.js', ", "'lib/zlib.js', " + ['_third_party_main', 'adm-zip'].map(function(name){
      tasks.push(function copyEmbedFile(cb){
        var input = fs.createReadStream(__dirname + '../embed/' + name + '.js')
            .on('error', cb),
          output = fs.createWriteStream(config.node.working + '/lib/' + name + '.js')
            .on('error', cb)
            .on('end', function(){
              debug('embedded', name);
              cb();
            });

        input.pipe(output);
      });
      return " 'lib/" + name + '"';
    })).join(',\n');

    derp(config, tasks, fn);
  });
};

// Run make to create the executable
module.exports.make = function(config, fn){
  derp.sync(config, derp.run('./configure', config.node.working),
    derp.run('./make', config.node.working), fn);
};
