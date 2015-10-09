var Clingo = require('clingojs');
var Sampler = require('weighted-reservoir-sampler');
var path = require('path');
var debug = require('debug')('redact');

var Melody = function(config) {
    config = config || {};
    this.inc = config.increment || 1;
};

Melody.prototype.generate = function(number, chords, callback) {
    number = Number(number);
    if (number < 0) throw Error("Number must be greater than 0!");
    debug("Melody incremental solver: " + number + " increments.");
    this._solveIncrement(chords, 0, number, callback);
};

Melody.prototype._solveIncrement = function(previous, it, end, callback) {
    var inc = this.inc;
    var solveIncrement = function(previous, it, end, callback) {
        if ((end - it) % inc !== 0) it += (end - it) % inc;
        previous = previous || [];
        previous = previous.concat(['#show playNote/2', '#show releaseNote/2']);
        if (it !== end) previous = previous.concat(['#show playChord/2']);
        var input = previous.reduce(function(acc, it) { return acc + it + '. '; }, '');
        var sampler = new Sampler();
        var clingo = new Clingo().config({
            maxModels: 0
        });
        var modelCount = 0;
        debug("Increment " + it + " begin: " + input);
        clingo.solve({
            inputFiles: [path.resolve(__dirname, '../lp/music'),
                path.resolve(__dirname, '../lp/rhythm'),
                path.resolve(__dirname, '../lp/melody')],
            constants: { from: it, to: it+inc-1 },
            input: input
        })
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

module.exports = Melody;