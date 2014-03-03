var lone = require('../embed/_third_party_main.js'),
  assert = require('assert'),
  fs = require('fs');

describe('lone', function(){
  it.skip('should work with just a zip', function(done){
    lone(__dirname + '/fixtures/js-only-app.zip', function(err, res){
      if(err) return done(err);
      assert(fs.existsSync(res.dest));
      done();
    });
  });
  it('should work with a zip appended to node');
});
