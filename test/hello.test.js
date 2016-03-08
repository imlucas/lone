var assert = require('assert');
var exec = require('child_process').exec;
var lone = require('../');
var path = require('path');

describe('hello', function() {
  after(path.remove.bind(null, path._additions));
  it('should deliver a runnable executable', function(done) {
    lone({
      cache: path.join(__dirname, '.lone'),
      src: path.join(__dirname, 'fixtures', 'hello')
    }, function(err, res) {
      assert.ifError(err);

      assert.equal(res.ignore.length, 2, 'Should ignore lone and devDependencies');

      assert.equal(res.src, path.join(__dirname, 'fixtures', 'hello'));
      exec(res.out, function(_err, stdout) {
        assert.ifError(-err);

        assert.equal(stdout.toString().replace('\n', ''), 'hello');
        done();
      });
    });
  });
});
