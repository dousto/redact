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
apt-get install -y nodejs
apt-get install -y npm

# Node conflicts with another apt-get package, so we have to rename 'nodejs' to 'node'
update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10