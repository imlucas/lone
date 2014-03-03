#!/usr/bin/env node
"use strict";

var bson = require('../');

if(process.argv[0] === 'node'){
  // not running via lone.
  process.argv.shift();
}
process.argv.shift();

if(process.argv.length){
  return console.log(bson.decode(new Buffer(process.argv[0], 'base64')));
}

console.log(bson.encode({lone: 1}).toString('base64'));
