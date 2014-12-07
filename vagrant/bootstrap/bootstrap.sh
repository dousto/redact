#!/bin/bash

#Install required apt-get packages
apt-get update

# ASP packages
apt-get install -y gringo

# Midi to MP3 packages
apt-get install -y lame
apt-get install -y timidity
apt-get install -y fluid-soundfont-gm

# Install development stuff
apt-get install -y git

# Install specific node version, and latest npm
apt-get install -y build-essential
wget http://nodejs.org/dist/v0.10.33/node-v0.10.33.tar.gz
tar -zxf node-v0.10.33.tar.gz
cd node-v0.10.33
./configure && make && make install
rm -r node-v0.10.33
rm node-v0.10.33.tar.gz
curl https://www.npmjs.org/install.sh | sh