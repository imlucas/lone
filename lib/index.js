module.exports = {};
'configure bundle compile deliver options'.split(' ').map(function(name){
  module.exports[name] = require('./' + name);
});
