var path = require('path');
var debug = require('debug')('redact');
var IncrementalSolver = require('../lib/incremental-solver');

var ChordVoicing = function(config) {
  config = config || {};
  this.inc = config.increment || 1;
};

ChordVoicing.prototype.generate = function(number, chords, callback) {
  number = Number(number);
  if (number < 0) throw Error("Number must be greater than 0!");
  debug("ChordVoicing incremental solver: " + number + " increments.");
  new IncrementalSolver({
    increment: this.inc,
    getClingoConfig: function(previous, it, end, inc) {
      previous = previous || [];
      if (it !== end) {
        previous = previous.concat([
          '#show playChord/2',
          '#show playNote/2',
          '#show releaseNote/2'
        ]);
      } else {
        previous = previous.concat([
          '#show playNote/2',
          '#show releaseNote/2'
        ]);
      }
      var input = previous.reduce(function(acc, it) { return acc + it + '. '; }, '');

      return {
        inputFiles: [path.resolve(__dirname, '../lp/music'),
          path.resolve(__dirname, '../lp/chord_voicing')],
        constants: { from: Math.max(0, it-inc), to: it },
        input: input
      };
    }
  }).solve(chords, 0, number, function(result) {
      debug('ChordVoicing result: ' + result);
      callback(result);
    });
};

module.exports = ChordVoicing;