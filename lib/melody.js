var path = require('path');
var debug = require('debug')('redact');
var IncrementalSolver = require('../lib/incremental-solver');

var Melody = function(config) {
  config = config || {};
  this.inc = config.increment || 2;
  this.rng = config.rng;
};

Melody.prototype.generate = function(number, chords, callback) {
  number = Number(number);
  if (number < 0) throw Error("Number must be greater than 0!");
  var inc = this.inc;
  debug("Melody incremental solver: " + number + " increments.");
  var prevResult = [];
  new IncrementalSolver({
    increment: inc,
    rng: this.rng,
    weightFunction: function(model) {
      var diff = model.filter(function(i) { return prevResult.indexOf(i) < 0 });
      var weight = 1;
      diff.forEach(function(atom) {
        if (atom.indexOf('playNote') >= 0) weight *= 0.25;
      });
      return weight;
    },
    getClingoConfig: function(previous, it, end, inc) {
      previous = previous || [];
      prevResult = previous;
      if (it !== end) {
        previous = previous.concat([
          '#show playChord/2',
          '#show play/1',
          '#show dontplay/1',
          '#show holdNote/2',
          '#show playNote/2',
          '#show releaseNote/2'
        ]);
      } else {
        previous = previous.concat([
          'finish',
          '#show playNote/2',
          '#show releaseNote/2'
        ]);
      }
      var input = previous.reduce(function(acc, it) { return acc + it + '. '; }, '');

      return {
        inputFiles: [path.resolve(__dirname, '../lp/music'),
          path.resolve(__dirname, '../lp/melody')],
        constants: { from: 0, to: it },
        input: input
      };
    }
  }).solve(chords, 0, number, function(result) {
      debug('Melody result: ' + result);
      callback(result);
    });
};

module.exports = Melody;