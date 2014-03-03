"use strict";
var derp = require('./lib/derp');

module.exports = require('./lib');

module.exports.manifest = function(opts, fn){
  derp.sync(opts, module.exports.bundle.manifest, fn);
};

module.exports.zip = function(opts, fn){
  derp.sync(opts, module.exports.bundle.manifest,
    module.exports.bundle.zip, fn);
};
