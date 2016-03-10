var assert = require('assert');
var helpers = require('./helpers');
var debug = require('debug')('lone:test:restapp');
var request = require('request');

describe('restapp', function() {
  var proc;
  var url;

  after(function(done) {
    proc.kill();
    helpers.after(done);
  });

  it('should compile', function(done) {
    helpers.compileFixture('restapp', done);
  });

  it('should start the http server', function(done) {
    proc = helpers.spawnFixtureBinary('restapp');
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
