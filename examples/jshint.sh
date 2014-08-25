#!/usr/bin/env bash

git clone git@github.com:jshint/jshint.git ~/jshint
cd ~/jshint && npm install
npm install lone
./node_modules/.bin/lone
./.lone/.dist/jshint
