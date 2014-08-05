var async = require('async'),
  lone = require('./lib'),
  config = require('./lib/config');

module.exports = function(opts, fn){
  async.series([lone.configure.bind(null, opts), lone.bundle, lone.compile], function(err){
    return fn(err, config);
  });
};
module.exports.options = lone.options;
