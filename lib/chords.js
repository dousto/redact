var Clingo = require('clingojs');

var Sampler = require('weighted-reservoir-sampler');

var Chords = function() {};

Chords.prototype.generate = function(number) {
  if (number < 2) throw Error("Number of chords must be greater than 2!");

  var clingo = new Clingo().config({
    maxModels: 0
  });

  var sampler = new Sampler();

  var lastIteration;

  for (var i = 2; i < number+1; i++) {
    if (lastIteration) {

    }

    var lastIteration = clingo.solve({
      inputFiles: [path.resolve(__dirname, '../lp/music'),
        path.resolve(__dirname, '../lp/rhythm'),
        path.resolve(__dirname, '../lp/progression'),
        path.resolve(__dirname, '../lp/chord_voicing')],
      constants: { m: i },
      //constants: { from: 0, to: 2 },
      input: i == number ? ['#show playNote/2', '#show releaseNote/2'] : undefined
    })
      .on('model', function(model) {
        sampler.push(model);
      })
      .on('end', function() {
        clingo.solve({})
      })
  }
};

function solveIncrement(previous, it, end) {
  if (it == end) return previous;
  var proc = clingo.solve({
    inputFiles: [path.resolve(__dirname, '../lp/music'),
      path.resolve(__dirname, '../lp/rhythm'),
      path.resolve(__dirname, '../lp/progression'),
      path.resolve(__dirname, '../lp/chord_voicing')],
    constants: { m: i },
    //constants: { from: 0, to: 2 },
    input: i == number ? ['#show playNote/2', '#show releaseNote/2'] : undefined
  });
  if (prevoius) {
    previous.on('end')
  }
}