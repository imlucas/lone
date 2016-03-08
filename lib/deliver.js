var config = require('./config');
var fs = require('fs-extra');
var isWindows = require('os').platform() === 'win32';
var exec = require('child_process').exec;

module.exports = function(fn) {
  var debug = require('debug')('lone:compile:deliver');
  debug('copy node to', config.out);
  fs.copy(config.node.out, config.out, function(err) {
    if (err) {
      return fn(err);
    }

    var cmd;
    if (isWindows) {
      cmd = 'cmd /c copy /b ' + config.node.out + '+' + config.bundle + ' ' + config.out;
    } else {
      cmd = 'cat ' + config.node.out + ' ' + config.bundle + ' > ' + config.out;
    }
    debug('combining with bundle', cmd);
    exec(cmd, {
      env: process.env,
      maxBuffer: 20 * 1024 * 1024
    }, function(err) {
      if (err) {
        console.warn('oh noooosss', err);
        return fn(err);
      }
      fn();
    });
  });
};
