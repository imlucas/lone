var assert = require('assert');
var helpers = require('../helpers');

describe('hello', function() {
  after(helpers.after);
  var res = {
    ignore: []
  };

  it('should compile', function(done) {
    helpers.compileFixture('hello', function(err, _res) {
      assert.ifError(err);
      res = _res;
      done();
    });
  });

  it('should ignore lone and all devDependencies', function() {
    assert.equal(res.ignore.length, 2);
  });
  it('should execute and print hello', function(done) {
    helpers.runFixtureBinary('hello', function(err, stdout) {
      assert.ifError(err);

      assert.equal(stdout.toString().replace('\n', ''), 'hello');
      done();
    });
  });
});
