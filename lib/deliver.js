"use strict";

var derp = require('./derp'),
  debug = require('debug')('lone:deliver');

// move the executable somewhere's handy, renamed of course, and take care of
// any cleanup.
module.exports = function(config, fn){
  debug('sprinkling some crack on', config.out);
  derp.sync(config, derp.run('strip ' + config.node.out + ' -o ' + config.out),
    derp.cat(config.out, config.app.bundle, config.out), fn);
};
