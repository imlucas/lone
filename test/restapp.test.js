var assert = require('assert');
var spawn = require('child_process').spawn;
var path = require('path');
var lone = require('../');
var debug = require('debug')('lone:test:restapp');
var request = require('request');

describe('restapp', function() {
  var bin;
  var proc;
  var url;
  after(function() {
    proc.kill();
  });

  it('should create a binary', function(done) {
    lone({
      cache: path.join(__dirname, '.lone'),
      src: path.join(__dirname, 'fixtures', 'restapp')
    }, function(err, res) {
      bin = res.out;
      done(err);
    });
  });
  it('should start the http server', function(done) {
    proc = spawn(bin);
    proc.stdout.on('data', function(buf) {
      var msgs = buf.toString().split('\n');
      msgs.map(function(msg) {
        if (msg.length < 1) {
          return;
        }
        debug('stdout', msg);

        if (!url && msg.indexOf('http') === 0) {
          url = msg;
          done();
        }
      });
    });

    proc.stderr.on('data', function(buf) {
      debug('stderr', buf.toString());
    });

    proc.on('exit', function(code) {
      if (code !== 0) {
        done(new Error('non-zero exit! ' + code));
      }
    });
  });

  it('should serve the favicon', function(done) {
    assert(url, 'app failed to start?');
    request.get(url + '/favicon.ico', function(err, res) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      done();
    });
  });

  it('should handle a route that calls the mongo node native driver', function(done) {
    assert(url, 'app failed to start?');
    request.get(url + '/is-mongodb-running', function(err, res) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      done();
    });
  });
});
