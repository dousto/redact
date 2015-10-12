var path = require('path');
var debug = require('debug')('redact');
var IncrementalSolver = require('../lib/incremental-solver');

var Melody = function(config) {
    config = config || {};
    this.inc = config.increment || 4;
};

Melody.prototype.generate = function(number, chords, callback) {
  number = Number(number);
  if (number < 0) throw Error("Number must be greater than 0!");
  var inc = this.inc;
  debug("Melody incremental solver: " + number + " increments.");
  new IncrementalSolver({
    increment: inc,
    getClingoConfig: function(previous, it, end, inc) {
      previous = previous || [];
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
          path.resolve(__dirname, '../lp/rhythm'),
          path.resolve(__dirname, '../lp/melody')],
        constants: { mfrom: 0, mto: it, rfrom: 0, rto: it },
        input: input
      };
    }
  }).solve(chords, 0, number, function(result) {
      debug('Melody result: ' + result);
      callback(result);
    });
};

module.exports = Melody;