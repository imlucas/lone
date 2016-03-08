#!/usr/bin/env bash

git clone git@github.com:eslint/eslint.git ~/eslint;
cd ~/eslint && npm install
npm install lone
./node_modules/.bin/lone
./.lone/.dist/eslint
