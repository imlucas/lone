#!/usr/bin/env node

var fs = require('fs'),
  lone = require('../'),
  yargs = require('yargs').usage([
    'Turn your node.js app into a single file executable.',
    'Usage: lone [options]'
  ].join('\n'))
  .options(lone.options);

if(yargs.argv.h) return yargs.showHelp();

if(yargs.argv.setup) return console.error(fs.readFileSync(__dirname + '/setup', 'utf-8'));

lone(yargs.argv, function(err, conf){
  if(err) return console.error(':(', err.message) && process.exit(1);
  console.log(conf.out);
});
