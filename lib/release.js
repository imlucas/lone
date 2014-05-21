#!/usr/bin/env node

var request = require('request'),
  fs = require('fs'),
  os = require('os'),
  debug = require('debug')('lone:release'),
  token;

module.exports = function(config, fn){
  var tag = 'v' + config.app.version,
    platform = os.platform(),
    dest = config.app.name + '_' +
      (platform === 'darwin' ? 'osx' : platform) + (os.arch() !== 'x64' ? '_'+ os.arch() : ''),
    src = config.out;

  token = config.app.githubToken;

  if(!token){
    debug('not uploading to a github release because no github token set');
    return fn(null, config);
  }

  console.log('Uploading dist to github for release ' + tag);
  console.log('- dest: ', dest);
  console.log('- src: ', src);

  upload(config.app.github, tag, src, dest, function(err, res){
    if(err) return fn(err, config);

    debug('Uploaded asset for release ' + tag, res);

    config.app.githubRelease = res;
    config.app.githubAsset = res.asset;

    return fn(null, config);
  });
};

function upload(repo, tag, src, dest, fn){
  getReleases(repo, function(err, releases){
    if(err) return fn(err);
    var release = releases.filter(function(r){
      return r.tag_name === tag;
    })[0];

    if(release) return postDist(src, dest, release, fn);

    createRelease(repo, tag, '@todo: how to get a pretty message here automatically-ish...', function(err, release){
      if(err) return fn(err);
      postDist(src, dest, release, fn);
    });
  });
}

function postDist(src, dest, release, fn){
  fs.readFile(src, function(err, buf){
    var opts = {
        url: release.upload_url.replace('{?name}', ''),
        body: buf,
        qs: {name: dest, access_token: token},
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      };

    request.post(opts, function(err, res, body){
      if(err) return fn(err);
      var asset = JSON.parse(body);

      release.asset = asset;
      fn(null, asset);
    });
  });
}

function createRelease(repo, tag, body, fn){
  var data = {
    tag_name: tag,
    draft: true,
    name: tag,
    body: body
  };
  var url = 'https://api.github.com/repos/' + repo + '/releases';
  request.post(url, {
    qs: {access_token: token},
    body: JSON.stringify(data),
    headers: {'User-Agent': '@imlucas/lone release uploader'}
  }, function(err, res, body){
    if(err) return fn(err);
    console.log('created a new release for you.  you should go edit the description:', JSON.parse(body));
    fn(null, JSON.parse(body));
  });
}

function getReleases(repo, fn){
  var url = 'https://api.github.com/repos/' + repo + '/releases';
  request.get(url, {qs: {access_token: token}, headers: {
    'User-Agent': '@imlucas/lone release uploader'
  }}, function(err, res, body){
    if(err) return fn(err);
    fn(null, JSON.parse(body));
  });
}
