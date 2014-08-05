#!/usr/bin/env node
"use strict";

var bson = require('../');

if(process.argv[0] === 'node'){
  // not running via lone.
  process.argv.shift();
}
process.argv.shift();


if(process.env.decode){
  return console.log(bson.decode(new Buffer(process.env.decode, 'base64')));
}

console.log(bson.encode({lone: 1}).toString('base64'));
