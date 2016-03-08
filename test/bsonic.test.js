var assert = require('assert');
var child_process = require('child_process');
var lone = require('../');
var path = require('path');
var debug = require('debug')('lone:test:bsonic');

/**
 * TODO (imlucas) Skip this for now. Filed mongodb-js/lone#25
 * to fix properly.
 * @see https://github.com/mongodb-js/lone/issues/25
 */
describe.skip('bsonic', function() {
  after(path.remove.bind(null, path._additions));

  it('should deliver a runnable executable', function(done) {
    lone({
      cache: __dirname + '/.lone',
      src: __dirname + '/fixtures/bsonic'
    }, function(err, res) {
      assert.ifError(err);
      child_process.exec(res.out, {
        env: {
          decode: 'DwAAABBsb25lAAEAAAAA'
        }
      }, function(err, stdout, stderr) {
        debug('stderr', stderr.toString());
        debug('stdout', stdout.toString());
        assert.ifError(err);
        assert.equal(stdout.toString(), '{ lone: 1 }\n');
        done();
      });
    });
  });
});
