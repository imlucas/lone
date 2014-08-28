#!/usr/bin/env node

var mvm = require('mongodb-version-manager'),
  yargs = require('yargs')
    .usage('Usage: $0 [options] [COMMAND]')
    .describe('stable', 'Print latest stable version of MongoDB')
    .describe('unstable', 'Print latest unstable version of MongoDB')
    .describe('version', 'Any semver version string or query')
    .describe('url', 'Print the download URL')
    .example('m --stable --url', 'Print download URL for the latest stable version')
    .example('m --unstable', 'Print latest unstable version')
    .example('m stable [config]', 'Install or activate the latest stable MongoDB release')
    .example('m latest [config]', 'Install or activate the latest unstable MongoDB release')
    .example('m <version> [config]', 'Install or activate MongoDB <version>')
    .example('m shell', 'Open a MongoDB shell')
    .example('export PATH=`m path`:$PATH', 'Open a MongoDB shell')
    .example('m d', 'Start mongod in the foreground')
    .example('m --version="2.4.*"', 'Print latest 2.4 series version')

    ,
  argv = yargs.argv;

console.error('argv', argv);

if(argv.h || argv.help || (argv._[0] && argv._[0] === 'help')) return yargs.showHelp();

var version = argv.version;
if(argv.stable) version = 'stable';
if(argv.unstable) version = 'unstable';

if(version){
  mvm.resolve(version, function(err, v){
    if(err) return console.error(err);
    console.log(argv.url ? v.url : v.version);
  });
}
else if(argv._[0] && (argv._[0] !== 'ls')){
  var which = require('which');
  if(argv._[0] === 'path'){
    return mvm.path(function(err, p){
      console.log(p);
    });
  }
  if(argv._[0] === 'kill'){
    return mvm.kill(function(){});
  }
  if(argv._[0] === 'is'){
    argv._.shift();
    return mvm.is(argv._.join(' '), function(err, res){
      process.exit(res === true ? 0 : 1);
    });
  }
  if(argv._[0] === 'shell'){
    return require('child_process').spawn(which.sync('mongo'), {stdio: 'inherit'});
  }

  if(argv._[0] === 'd'){
    return require('child_process').spawn(which.sync('mongod'), {stdio: 'inherit'});
  }

  mvm.use(argv._[0], function(err){
    if(err) return console.error(err);
    mvm.current(function(err, v){
      if(err) return console.error(err);
      console.log('switched to ' + v);
    });
  });
}
else {
  mvm.current(function(err, current){
    mvm.installed(function(err, versions){
      if(err){
        console.error(err);
        return process.exit(1);
      }

      if(!versions || versions.length <1){
        console.log('  no versions installed');
        return process.exit(0);
      }

      console.log(versions.map(function(v){
        if(v === current){
          return '  \033[32mο\033[0m '+v+' \033[90m \033[0m';
        }
        else {
          return '  ' + v + '\033[90m \033[0m';
        }
      }).join('\n'));
    });
  });
}
