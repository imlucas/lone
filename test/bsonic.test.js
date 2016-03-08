var assert = require('assert');
var path = require('path');
var exec = require('child_process').exec;
var lone = require('../');
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
      cache: path.join(__dirname, '.lone'),
      src: path.join(__dirname, 'fixtures', 'bsonic')
    }, function(err, res) {
      assert.ifError(err);
      exec(res.out, {
        env: {
          decode: 'DwAAABBsb25lAAEAAAAA'
        }
      }, function(_err, stdout, stderr) {
        debug('stderr', stderr.toString());
        debug('stdout', stdout.toString());
        assert.ifError(_err);
        assert.equal(stdout.toString(), '{ lone: 1 }\n');
        done();
      });
    });
  });
});
