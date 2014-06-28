module.exports = {};
'configure bundle compile options'.split(' ').map(function(name){
  module.exports[name] = require('./' + name);
});
