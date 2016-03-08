module.exports = {};
module.exports.__reset__ = function() {
  Object.keys(module.exports).map(function(k) {
    if (k !== '__reset__') {
      delete module.exports[k];
    }
  });
};
