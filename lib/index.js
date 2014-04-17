module.exports = {};
'configure bundle compile options release notify'.split(' ').map(function(name){
  module.exports[name] = require('./' + name);
});
