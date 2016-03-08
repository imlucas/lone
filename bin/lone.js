#!/usr/bin/env node

/* eslint no-console: 0, no-sync: 0 */

var fs = require('fs');
var path = require('path');

var USAGE = [
  'Turn your node.js app into a single file executable.',
  'Usage: lone [options]'
].join('\n');

var SETUP = fs.readFileSync(path.join(__dirname, '/setup'), 'utf-8');

var lone = require('../');
var yargs = require('yargs')
  .usage(USAGE)
  .options(lone.options);

if (yargs.argv.h) {
  return yargs.showHelp();
}

if (yargs.argv.setup) {
  return console.error(SETUP);
}

lone(yargs.argv, function(err, conf) {
  if (err) {
    return console.error(':(', err.message) && process.exit(1);
  }
  console.log(conf.out);
});
