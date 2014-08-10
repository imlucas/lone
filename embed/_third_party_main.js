var fs = require('fs'),
  os = require('os'),
  isWindows = os.platform() === 'win32',
  path = require('path'),
  embedded = false,
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  AdmZip;

try{
  AdmZip = require('./admzip');
}
catch(e){
  AdmZip = require('admzip');
  embedded = true;
}

function Lone(src){
  if(!(this instanceof Lone)) return new Lone(src);
  Lone.super_.call(this);

  this.src = src;
  this.dest = path.join(os.tmpDir(), path.basename(this.src.replace('.exe', '')));
  if(isWindows) this.dest = this.dest.replace('Temp\\', '');

  this.pkg = null;
  this.bundle = undefined;
  this.extract(function(err){
    if(err) return this._main();

    fs.readFile(path.resolve(this.dest + '/package.json'), 'utf-8', function(err, data){
      if(data) this.pkg = JSON.parse(data);
      this._main();

    }.bind(this));
  }.bind(this));
}
util.inherits(Lone, EventEmitter);

Lone.prototype._main = function(){
  if (process.argv[1] === 'debug') {
    // Start the debugger agent
    var d = require('_debugger');
    d.start();
  }
  else if (process.argv[1] && fs.existsSync(path.resolve(process.argv[1]))) {
    // make process.argv[1] into a full path
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
      return setTimeout(this._load.bind(this), debugTimeout);
    }
    this._load(process.argv[1]);
  }
  else if(this.pkg){
    this._load(path.resolve(this.dest, this.pkg.bin[this.pkg.name]));
  }
  process._tickCallback();
};

Lone.prototype._load = function(src){
  // XXX - make yargs/optimist/etc happy
  if(process.argv[0].indexOf('node') === -1){
    process.argv.unshift('node');
  }

  var Module = require('module');
  Module._load(src, null, true);
};

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
        return fn(new Error('0 zip chunks found in binary.'));
      }

      self.bundle = Buffer.concat(chunks);
      new AdmZip(self.bundle).extractAllTo(self.dest, true);
      fn();
    });
};

if(embedded){
  new Lone(process.execPath);
}
else {
  // we're running as a normal node module
  module.exports = Lone;
}
