var derp = require('./lib/derp'),
  lone = require('./lib');

module.exports = function(opts, fn){
  var steps = [lone.configure(opts), lone.bundle, lone.compile];
  steps.push(fn);
  derp.sync.apply(derp, steps);
};
module.exports.all = module.exports;

module.exports.manifest = function(opts, fn){
  derp.sync(lone.configure(opts), lone.bundle.manifest, fn);
};

module.exports.zip = function(opts, fn){
  derp.sync(lone.configure(opts), lone.bundle.manifest, lone.bundle.zip, fn);
};

module.exports.bundle = function(opts, fn){
  derp.sync(lone.configure(opts), lone.bundle, fn);
};

module.exports.compile = function(opts, fn){
  derp.sync(lone.configure(opts), lone.compile, fn);
};

module.exports.embed = function(opts, fn){
  derp.sync(lone.configure(opts), lone.compile.embed, fn);
};

module.exports.download = function(opts, fn){
  derp.sync(lone.configure(opts), lone.compile.download, fn);
};

module.exports.make = function(opts, fn){
  derp.sync(lone.configure(opts), lone.compile.make, fn);
};

module.exports.actions = Object.keys(module.exports);
module.exports.options = lone.options;
