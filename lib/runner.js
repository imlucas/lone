var spawn = require('child_process').spawn;

module.exports = function(debug, cwd){
  cwd = cwd || process.cwd();
  return function(cmd){
    return function(cb){
      var args = cmd.split(' ');

      var proc = spawn(args.shift(), args, {cwd: cwd, env: process.env});
      proc.stdout.on('data', function(buf){
        debug('stdout', buf.toString('utf-8'));
      });
      proc.stderr.on('data', function(buf){
        debug('stderr', buf.toString('utf-8'));
      });
      proc.on('exit', function(code, signal){
        if(code !== 0){
          if(signal) return cb(new Error('Process killed by signal ' + signal));

          return cb(new Error('Non-zero exit! ' + code));
        }
        cb();
      });
    };
  };
};
