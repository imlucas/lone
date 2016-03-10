var assert = require('assert');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var format = require('util').format;
var lone = require('../');
var debug = require('debug')('lone:test:helpers');

var isWindows = exports.isWindows = process.platform === 'win32';

/**
 * TODO (imlucas) Fix path.remove(path._additions)
 */

exports.after = function(done) {
  done();
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
  if (isWindows) {
    BIN += '.exe';
  }
  debug('fixture binary for `%s` at `%s`', name, BIN);
  debug('exec `%s` with args `%s`', BIN, args);
  fs.exists(BIN, function(exists) {
    if (!exists) {
      return done(new Error(format('`%s` does not exist!', BIN)));
    }
    exec(BIN, args, function(err, stdout, stderr) {
      debug('stdout: ', stdout.toString('utf-8'));
      debug('stderr: ', stderr.toString('utf-8'));
      done(err, stdout, stderr);
    });
  });
};

exports.spawnFixtureBinary = function(name, args) {
  /* eslint no-sync: 0 */
  args = args || [];

  var BIN = path.join(__dirname, 'fixtures', name, '.lone', 'dist', name);
  if (isWindows) {
    BIN += '.exe';
  }
  debug('fixture binary for `%s` at `%s`', name, BIN);

  var exists = fs.existsSync(BIN);
  assert(exists, format('`%s` does not exist!', BIN));

  debug('spawn `%s` with args `%s`', BIN, args);
  var proc = spawn(BIN, args);
  return proc;
};

module.exports = exports;
