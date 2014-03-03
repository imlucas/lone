"use strict";
var async = require('async'),
  fs = require('fs');

module.exports = lone;
'configure bundle source deliver options'.split(' ').map(function(name){
  module.exports[name] = require('./' + name);
});

function lone(src, opts, fn){
  if(typeof opts === 'function') fn = opts; opts = {};

  async.waterfall([
    module.exports.configure({src: src, node: {version: opts.node || '0.10.26'}}),
    module.exports.bundle,
    module.exports.source,
    module.exports.deliver
  ], fn);
}
