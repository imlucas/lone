var async = require('async'),
  lone = require('./lib');

module.exports = function(opts, fn){
  async.series([lone.configure.bind(null, opts), lone.bundle, lone.compile], fn);
};
module.exports.options = lone.options;
