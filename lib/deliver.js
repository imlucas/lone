var config = require('./config'),
  fs = require('fs-extra'),
  isWindows = require('os').platform() === 'win32',
  exec = require('child_process').exec;

module.exports = function(fn){
  var debug = require('debug')('lone:compile:deliver');
  debug('copy node to', config.out);
  fs.copy(config.node.out, config.out, function(err){
    if(err) return fn(err);

    var cmd;
    if(isWindows){
      cmd = 'cmd /c copy /b ' + config.node.out + '+' + config.bundle + ' ' + config.out;
    }
    else {
      cmd = 'cat ' + config.node.out + ' ' + config.bundle +  ' > ' + config.out;
    }
    debug('combining with bundle', cmd);
    exec(cmd, {env: process.env, maxBuffer: 20 * 1024 * 1024}, fn);
  });
};
