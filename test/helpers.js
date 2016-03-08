var exec = require('child_process').exec;
var lone = require('../');
var path = require('path');
var debug = require('debug')('lone:test:helpers');

exports.after = function(done) {
  path.remove(path._additions, done);
};

exports.compileFixture = function(name, done) {
  var opts = {
    cache: path.join(__dirname, '.lone'),
    src: path.join(__dirname, 'fixtures', name)
  };
  debug('compiling `%s` with options %j', name, opts);
  lone(opts, done);
};

exports.runFixtureBinary = function(name, args, done) {
  if (typeof args === 'function') {
    done = args;
    args = [];
  }

  var BIN = path.join(__dirname, 'fixtures', name, '.lone', 'dist', name);
  debug('fixture binary for `%s` at `%s`', name, BIN);
  debug('exec `%s` with args `%s`', BIN, args);

  exec(BIN, args, function(err, stdout, stderr) {
    debug('stdout: ', stdout.toString('utf-8'));
    debug('stderr: ', stderr.toString('utf-8'));
    done(err, stdout, stderr);
  });
};
