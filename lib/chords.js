var path = require('path');
var debug = require('debug')('redact');
var IncrementalSolver = require('../lib/incremental-solver');

var Chords = function(config) {
  config = config || {};
  this.rng = config.rng;
  this.inc = config.increment || 5;
};

Chords.prototype.generate = function(number, callback) {
  number = Number(number);
  if (number < 2) throw Error("Number of chords must be greater than 2!");
  debug("Chord incremental solver: " + number + " increments.");
  new IncrementalSolver({
    increment: this.inc,
    rng: this.rng,
    getClingoConfig: function(previous, it, end, inc) {
      previous = previous || [];
      previous = previous.concat(['#show playChord/2']);
      var input = previous.reduce(function(acc, it) { return acc + it + '. '; }, '');

      return {
        inputFiles: [path.resolve(__dirname, '../lp/progression')],
        constants: { m: it },
        input: input
      };
    }
  }).solve([], 2, number, function(result) {
      debug("Chords result: " + result);
      callback(result);
    });
};

module.exports = Chords;