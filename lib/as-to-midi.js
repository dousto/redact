var Midi = require('jsmidgen');

var AStoMIDI = function(config) {
  if (config) {
    this._config = config;
  } else {
    this._config = {
      clingo: 'clingo',
      maxModels: 1
    };
  }
};

AStoMIDI.prototype.convertToMidiEvents = function(as) {
  as.each(function(a) {
    var parse = a.split("(");
    var type = parse1[0];
    var parse = parse[1].split(")")[0].split(",");
  });
  return "hi";
};

module.exports = AStoMIDI;