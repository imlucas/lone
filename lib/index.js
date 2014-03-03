"use strict";
var async = require('async'),
  fs = require('fs');

module.exports = function(src, opts, fn){
  if(typeof opts === 'function') fn = opts; opts = {};

  async.waterfall([
    require('./prepare')({src: src, node: {version: opts.version || '0.10.26'}}),
    require('./bundle'),
    require('./source'),
    require('./deliver')
  ], fn);
};

module.exports.options = {
  setup: {
    boolean: true,
    desc: 'show some helpful setup notes'
  },
  out: {
    default: process.cwd().replace(process.env.HOME, '~') + '/.dist/{{app name}}',
    desc: 'where to deliver your app exectuable'
  },
  node: {
    default: '0.10.26',
    desc: 'node version to build against'
  },
  cache: {
    default: '~/.lone/',
    desc: 'temp-ish directory where lone can do it thing'
  }
};
