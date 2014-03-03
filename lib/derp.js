"use strict";

var comb = require('combined-stream'),
  async = require('async'),
  fs = require('fs'),
  exec = require('child_process').exec,
  path = require('path'),
  mkdirp = require('mkdirp'),
  debug = require('debug')('lone:derp');

module.exports = function parallel(){
  var args = Array.prototype.slice.call(arguments, 0),
    config = args.shift(),
    fn = args.pop();

  async.parallel(args, function(err){
    if(err) return fn(err);
    fn(null, config);
  });
};

module.exports.sync = function waterfall(){
  var args = Array.prototype.slice.call(arguments, 0),
    fn = args.pop(),
    config = args.shift(),
    tasks = [function(cb){cb(null, config);}];

  tasks.push.apply(tasks, args);
  async.waterfall(tasks, function(err){
    fn(err, config);
  });
};

var each = module.exports.each = function each(){
  var args = Array.prototype.slice.call(arguments, 0),
    fn = args.pop(),
    iterator = args.pop(),
    config = args.shift();

  async.each(args, iterator, function(err){fn(err, config);});
};

module.exports.directory = function(){
  var args = Array.prototype.slice.call(arguments, 0);
  args.splice(args.length - 1, 0, mkdirp);
  each.apply(each, args);
};

module.exports.cat = function(fn){
  var args = Array.prototype.slice.call(arguments, 0);

  return function(config, cb){
    var out = fs.createWriteStream(args.pop()).on('error', fn).on('end', fn),
      s = comb.create();

    args.map(function(src){s.append(fs.createReadStream(src));});
    s.pipe(out);
  };
};

module.exports.run = function(cmd, cwd){
  return function(config, cb){
    debug('run', cmd);
    exec(cmd, {cwd: cwd}, function(err){
      if(err) return cb(err);
      cb(null, config);
    });
  };
};

module.exports.resolve = function(s){
  if (s.substr(0,1) === '~') s = process.env.HOME + s.substr(1);
  return path.resolve(s);
};
