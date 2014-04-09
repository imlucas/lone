#!/usr/bin/env bash

sudo apt-get install -y software-properties-common python-software-properties && \
  sudo apt-add-repository -y ppa:chris-lea/node.js && \
  sudo apt-get update && \
  sudo apt-get install -y nodejs;

# sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10 && \
#   echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list && \
#   sudo apt-get update;


cp -r /lone ~/ && rm -rf ~/lone/node_modules && cd ~/lone && npm install;
