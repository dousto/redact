var Clingo = require('clingojs');
var Sampler = require('weighted-reservoir-sampler');
var path = require('path');
var debug = require('debug')('redact');
var IncrementalSolver = require('../lib/incremental-solver');

var Melody = function(config) {
    config = config || {};
    this.inc = config.increment || 2;
};

Melody.prototype.generate = function(number, chords, callback) {
  number = Number(number);
  if (number < 0) throw Error("Number must be greater than 0!");
  debug("Melody incremental solver: " + number + " increments.");
  var solver = new IncrementalSolver({
    increment: 2,
    getClingoConfig: function(previous, it, end, inc) {
      previous = previous || [];
      previous = previous.concat(['#show playNote/2', '#show releaseNote/2']);
      if (it !== end) {
        previous = previous.concat([
          '#show playChord/2',
          '#show play/1',
          '#show dontplay/1',
          '#show holdNote/2']);
      } else {
        previous = previous.concat(['finish']);
      }
      var input = previous.reduce(function(acc, it) { return acc + it + '. '; }, '');

      return {
        inputFiles: [path.resolve(__dirname, '../lp/music'),
          path.resolve(__dirname, '../lp/rhythm'),
          path.resolve(__dirname, '../lp/melody')],
        constants: { from: it, to: it+inc-1 },
        input: input
      };
    }
  }).solve(chords, 0, number, callback);
};

module.exports = Melody;