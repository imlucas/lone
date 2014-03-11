#!/usr/bin/env node

var fs = require('fs'),
  lone = require('../'),
  yargs = require('yargs')
    .usage([
      'Turn your node.js app into a single file executable.',
      'Usage: lone [action]\n',
      // '```',
      // 'cd ~/my-app && npm install --save-dev jsontool lone && \\',
      // '`npm bin`/json -I -f package.json -c \'this.scripts.build="lone"\' && \\',
      // 'npm run-script build;',
      // '```',
      'where [action] is any one of: ' + lone.actions.join(', ')
    ].join('\n'))
    .options(lone.options)
    .demand(0);

if(yargs.argv.h) return yargs.showHelp();

if(yargs.argv.setup) return console.error(fs.readFileSync(__dirname + '/setup', 'utf-8'));

var action = yargs.argv._[0] || 'all';

if(lone.actions.indexOf(action) === -1){
  console.error('unknown action `'+action+'`');
  return yargs.showHelp();
}

lone[action](yargs.argv, function(err, conf){
  if(err) return console.error(':(', err.message) && process.exit(1);
  console.log(conf.out);
});
