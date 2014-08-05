var async = require('async'),
  lone = require('./lib'),
  config = require('./lib/config');

module.exports = function(opts, fn){
  async.series([lone.configure.bind(null, opts), lone.compile, lone.bundle, lone.deliver], function(err){
    return fn(err, config);
  });
};
module.exports.options = lone.options;
