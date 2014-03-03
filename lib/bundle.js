"use strict";

var child_process = require('child_process'),
  AdmZip = require('../embed/adm-zip'),
  fs = require('fs');

module.exports = function(config, fn){
  // run npm shrinkwrap
  // run npm install
  // create manifest
  // create zip and add all files to it
  // write zip to config.out
};

module.exports.manifest = function(config, fn){
  var ignore = [
    '.*.swp',
    '._*',
    '.DS_Store',
    '.git',
    'npm-debug.log',
  ];
};

module.exports.zip = function(config, fn){

};
