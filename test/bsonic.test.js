var assert = require('assert'),
  child_process = require('child_process'),
  lone = require('../'),
  path = require('path');

describe('bsonic', function(){
  after(path.remove.bind(null, path._additions));

  it('should deliver a runnable executable', function(done){
    lone({src: __dirname + '/fixtures/bsonic', node: '0.10.29'}, function(err, res){
      assert.ifError(err);

      child_process.exec(res.out, {env: {decode: 'DwAAABBsb25lAAEAAAAA'}}, function(err, stdout){
        assert.ifError(err);
        assert.equal(stdout.toString(), '{ lone: 1 }\n');
        done();
      });
    });
  });
});
