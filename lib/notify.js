var debug = require('debug')('lone:notify'),
  exec = require('child_process').exec;

module.exports = function(config, fn){
  if(!config.notify || !config.githubRelease){
    debug('skipping notify because no github release or nootify not enabled');
    return fn(null, config);
  }
  gmail(config, fn);
};


function gmail(config, fn){
  var url = 'http://mail.google.com/mail/?view=cm&fs=1&tf=1&to=' +
    config.notifyEmail + '&su=[ANN] ' + config.app.name + ': ' +
    config.app.version + ' &body=Hey,\nI just did the binary dance and ' +
    'a fresh download of ' + config.app.name + ' is up on GitHub.\n\n' +
    config.app.githubAsset.url + '\n\nAs usual, please post any ' +
    'issues you hit to ' + config.app.githubIssues + '\n\nThanks!';

  exec('open ' + url);
  fn(null, config);
}
