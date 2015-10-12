var path = require('path');
var debug = require('debug')('redact');
var IncrementalSolver = require('../lib/incremental-solver');

var Rhythm = function(config) {
  config = config || {};
  this.inc = config.increment || 4;
};

Rhythm.prototype.generate = function(number, callback) {
  number = Number(number);
  if (number < 0) throw Error("Number must be greater than 0!");
  debug("Rhythm incremental solver: " + number + " increments.");
  new IncrementalSolver({
    increment: this.inc,
    getClingoConfig: function(previous, it, end, inc) {
      previous = previous || [];
      previous = previous.concat([
        '#show play/1',
        '#show dontplay/1'
      ]);
      var input = previous.reduce(function(acc, it) { return acc + it + '. '; }, '');

      return {
        inputFiles: [path.resolve(__dirname, '../lp/rhythm')],
        constants: { from: 0, to: it },
        input: input
      };
    }
  }).solve([], 0, number, function(result) {
      debug('Rhythm result: ' + result);
      callback(result);
    });
};

module.exports = Rhythm;