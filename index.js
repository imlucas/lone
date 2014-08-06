var async = require('async'),
  lone = require('./lib'),
  config = require('./lib/config'),
  extend = require('extend');

module.exports = function(opts, fn){
  async.series([lone.configure.bind(null, opts), lone.compile, lone.bundle, lone.deliver], function(err){
    var res = extend(true, {}, config);
    config.__reset__();
    return fn(err, res);
  });
};
module.exports.options = lone.options;
