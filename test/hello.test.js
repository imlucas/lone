var assert = require('assert'),
  child_process = require('child_process'),
  lone = require('../');

describe('hello', function(){
  it('should deliver a runnable executable', function(done){
    lone({src: __dirname + '/fixtures/hello', node: '0.10.29'}, function(err, res){
      if(err) return done(err);

      assert.equal(res.src, __dirname + '/fixtures/hello');
      child_process.exec(res.out, function(err, stdout){
        if(err) return done(err);
        assert.equal(stdout.toString().replace('\n', ''), 'hello');
        done();
      });
    });
  });
});
