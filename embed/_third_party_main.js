var fs = require('fs'),
  os = require('os'),
  path = require('path'),
  zlib = require('zlib'),
  embedded = false,
  AdmZip;

try{
  AdmZip = require('./admzip');
}
catch(e){
  AdmZip = require('admzip');
  embedded = true;
}

function Lone(src, fn){
  this.src = src;
  this.dest = path.join(os.tmpDir(), path.basename(this.src));
  this.pkg = {};
  this.bundle = undefined;
  this.extract(function(err, self){
    if(err) return fn(err);

    fs.readFile(self.dest + '/package.json', 'utf-8', function(err, data){
      if(err) return fn(err);

      self.pkg = JSON.parse(data);
      var Module = require('module');
      Module._load(path.resolve(self.dest, self.pkg.bin[self.pkg.name]), null, true);
    });
  });
}

// find a buffer from `this.src` that looks like a zip file,
// possibly inside another file and extract it to `this.dest`.
Lone.prototype.extract = function(fn){
  var self = this,
    found = false,
    chunks = [];

  this.bundle = null;
  fs.createReadStream(this.src)
    .on('error', fn)
    .on('data', function(buf){
      if(found) return chunks.push(buf);

      for(var pos=0; pos<buf.length - 32; pos++){
        if(buf.readUInt32LE(pos) === 0x04034b50){
          found = true;
          chunks.push(buf.slice(pos));
          break;
        }
        // @todo: support tar.gz: `buf.readUInt16LE(pos) === 0x8b1f`
      }
    })
    .on('end', function(){
      if(chunks.length === 0){
        return fn(new Error('No bundle embedded in ' + self.src));
      }
      self.bundle = Buffer.concat(chunks);
      new AdmZip(self.bundle).extractAllTo(self.dest, true);
      fn(null, self);
    });
};

if(embedded){
  new Lone(process.execPath, function(err, lone){
    if(err){
      return console.error('lonejs: failed to extract', err);
    }

  });
}
else {
  // we're running as a normal node module
  module.exports = function(src, fn){
    return new Lone(src, fn);
  };
  module.exports.Lone = Lone;
}
