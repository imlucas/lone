var fs = require('fs'),
  os = require('os'),
  isWindows = os.platform() === 'win32',
  path = require('path'),
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
  this.dest = path.join(os.tmpDir(), path.basename(this.src.replace('.exe', '')));
  if(isWindows){
    this.dest = this.dest.replace('Temp\\', '');
  }
  this.pkg = {};
  this.bundle = undefined;
  this.extract(function(err, self){
    if(err) return fn(err);
    fs.readFile(path.resolve(self.dest + '/package.json'), 'utf-8', function(err, data){
      if(err) return fn(err);

      self.pkg = JSON.parse(data);
      if (process.argv[1] == 'debug') {
        // Start the debugger agent
        var d = require('_debugger');
        d.start();
      } else if (process.argv[1]) {
        // make process.argv[1] into a full path
        var path = require('path');
        process.argv[1] = path.resolve(process.argv[1]);
        if (process.env.NODE_UNIQUE_ID) {
          var cluster = require('cluster');
          cluster._setupWorker();
          delete process.env.NODE_UNIQUE_ID;
        }

        if (global.v8debug && process.execArgv.some(function(arg) {
              return arg.match(/^--debug-brk(=[0-9]*)?$/);
            })) {
          var debugTimeout = +process.env.NODE_DEBUG_TIMEOUT || 50;
          return setTimeout(main, debugTimeout);
        }
        return main(self);
      } else {
        main(self);
      }
      process._tickCallback();
      fn(null, self);
    });
  });
}

function main(self){
  var Module = require('module'),
    src = process.argv[1] ? process.argv[1] : path.resolve(self.dest, self.pkg.bin[self.pkg.name]);
  try{
    Module._load(src, null, true);
  }
  catch(e){
    console.error('lone: failed to load module!', e);
    process.exit(1);
  }
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
        return fn(new Error('lone: no bundle embedded in ' + self.src + '.  0 zip chunks found in binary.'));
      }
      self.bundle = Buffer.concat(chunks);
      new AdmZip(self.bundle).extractAllTo(self.dest, true);
      fn(null, self);
    });
};

if(embedded){
  new Lone(process.execPath, function(err){
    if(err){
      return console.error('lone: failed to extract', err);
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
