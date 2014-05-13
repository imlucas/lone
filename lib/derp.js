var async = require('async'),
  exec = require('child_process').exec,
  path = require('path'),
  os = require('os'),
  isWindows = os.platform() === 'win32',
  mkdirp = require('mkdirp'),
  debug = require('debug')('lone:derp');

function getTasks(args){
  if(args.length === 1 && Array.isArray(args[0])){
    return args[0];
  }
  return args;
}

module.exports = function parallel(){
  var args = Array.prototype.slice.call(arguments, 0),
    config = args.shift(),
    fn = args.pop();

  async.parallel(getTasks(args), function(err){
    if(err) return fn(err);
    fn(null, config);
  });
};

module.exports.sync = function waterfall(){
  var args = Array.prototype.slice.call(arguments, 0),
    fn = args.pop(),
    config = args.shift(),
    tasks = [config];

  if(typeof config !== 'function'){
    tasks = [function config_passthrough(cb){cb(null, config);}];
  }

  tasks.push.apply(tasks, getTasks(args));

  async.waterfall(tasks, fn);
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

module.exports.cat = function(){
  var args = Array.prototype.slice.call(arguments, 0);

  return function(config, cb){
    var dest = args.pop();
    if(isWindows){
      return run('cmd /c copy /b ' + args.join('+') + ' ' + dest)(config, cb);
    }
    run('cat ' + args.join(" ") + ' > ' + dest)(config, cb);
  };
};

var run = module.exports.run = function(cmd, cwd){
  return function(config, cb){
    debug('run', cmd);
    exec(cmd, {cwd: cwd || process.cwd(), maxBuffer: 20 * 1024 * 1024}, function(err){
      debug('cmd result', arguments)
      if(err) return cb(err);
      cb(null, config);
    });
  };
};

module.exports.resolve = function(s){
  if (s.substr(0,1) === '~') s = process.env.HOME + s.substr(1);
  return path.resolve(s);
};

module.exports.relativity = function(s){
  return s.replace(process.cwd(), '.');
};

module.exports.extend = function(obj, source){
  for (var prop in source) {
    obj[prop] = source[prop];
  }
  return obj;
};
