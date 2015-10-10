var Sampler = require('weighted-reservoir-sampler');
var Clingo = require('clingojs');
var debug = require('debug')('redact');

var IncrementalSolver = function(config) {
  this.increment = config.increment || 1;
  this.getClingoConfig = config.getClingoConfig || {};
  this.sampler = new Sampler({
    weightFunction: config.weightFunction || function() { return 1; },
    random: config.rng || Math.random
  });
};

IncrementalSolver.prototype.solve = function(previous, it, end, callback) {
  var inc = this.increment;
  var getClingoConfig = this.getClingoConfig;
  var sampler = this.sampler;
  var solveIncrement = function(previous, it, end, callback) {
    if ((end - it) % inc !== 0) it += (end - it) % inc;
    var clingo = new Clingo().config({
      maxModels: 0
    });
    var clingoConfig = getClingoConfig(previous, it, end, inc);
    var modelCount = 0;
    debug("Increment " + it + " begin: " + clingoConfig.input);
    clingo.solve(clingoConfig)
      .on('model', function(model) {
        modelCount++;
        sampler.push(model);
      })
      .on('end', function() {
        debug("Increment " + it + " end: " + modelCount + " models.");
        var result = sampler.end()[0];
        if (it >= end) {
          callback(result)
        } else {
          solveIncrement(result, it+inc, end, callback)
        }
      });
  };
  solveIncrement(previous, it, end, callback);
};

module.exports = IncrementalSolver;