var lone = require('../embed/_third_party_main.js'),
  assert = require('assert'),
  fs = require('fs');

describe('lone', function(){
  var realLog = console.log;
  before(function(done){
    console.log = function(){
      console._counter = 1;
    };
    require('../')({src: __dirname + '/fixtures/hello'}, function(){
      done();
    });
  });

  after(function(){
    console.log = realLog;
    console._counter = 0;
  });

  it('should work with just a zip', function(done){
    lone(__dirname + '/fixtures/hello/.lone/build/hello.zip', function(err, res){
      if(err) return done(err);

      assert(fs.existsSync(res.dest + '/index.js'), 'did not unpack bundle');
      assert(console._counter === 1, 'did not get a hello');
      done();
    });
  });

  it('should work with a zip appended to node', function(done){
    lone(__dirname + '/fixtures/hello/.lone/dist/hello', function(err, res){
      if(err) return done(err);

      assert(fs.existsSync(res.dest + '/index.js'), 'did not unpack bundle');
      assert(console._counter === 1, 'did not get a hello');
      done();
    });
  });
});
