var path = require('path'),
  untildify = require('untildify');

path.__resolve__ = path.resolve;
path.resolve = function(){
  var args = Array.prototype.slice.call(0, arguments).map(function(s){
    return untildify(s);
  });
  return path.__resolve__.apply(null, args);
};

var nconf = require('nconf'),
  path = require('path'),
  options = require('./options');

nconf.argv().env().use('memory').defaults({
  src: path.resolve(process.cwd()),
  out: path.resolve('{src}/.lone/dist/{app.name}'),
  bundle: path.resolve('{src}/.lone/build/{app.name}.zip'),
  ignore: [],
  app: {
    name: null,
    author: null,
    bin: null,
    dependencies: {},
    description: null,
    devDependencies: {},
    icon: path.resolve('src', 'pkg.lone.icon'),
    version: null,
    github: {
      repo: null,
      token: process.env.GITHUB_TOKEN
    },
  },
  node: {
    cache: path.resolve(options.cache.default),
    version: 'latest',
    out: path.resolve('{node.working}/Release/{exe(node)}'),
    filename: 'node-v{node.version}.tar.gz',
    url: 'http://nodejs.org/dist/latest/{node.filename}',
    build: path.resolve('{node.cache}/source/{node.filename}'), // formerly `dist`
    working: path.resolve('{node.cache}/node-v{node.version}')
  }
});

module.exports = {};
'configure bundle compile options release notify'.split(' ').map(function(name){
  module.exports[name] = require('./' + name);
});
