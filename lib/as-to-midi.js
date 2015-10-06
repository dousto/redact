var Midi = require('jsmidgen');

var AStoMIDI = function() {};

AStoMIDI.prototype.convertToMidiEvents = function(as, opts) {
  opts = opts || {};
  var scale = opts.scale || 128;
  var events = [];
  as.forEach(function(a){
    events.push(parseEvent(a));
  });

  events.sort(function(a, b) {
    var compare = a.time - b.time;
    if (compare !== 0) {
      return compare;
    } else if (a.type == Midi.Event.NOTE_OFF && b.type == Midi.Event.NOTE_ON) {
      return -1;
    } else if (a.type == Midi.Event.NOTE_ON && b.type == Midi.Event.NOTE_OFF) {
      return 1;
    } else {
      return 0;
    }
  });

  var curtime = 0;
  var midiEvents = [];
  var debug = require('debug')('redact');
  events.forEach(function(event) {
    debug(event);
    var time = scale + event.time * scale;
    midiEvents.push(new Midi.Event({
      type: event.type,
      channel: opts.channel || 0,
      param1: Midi.Util.ensureMidiPitch(event.note),
      param2: 100,
      time: time == curtime ? 0 : time
    }));

    curtime = time;
  });

  return midiEvents;
};

function parseEvent(event) {
  var parse = event.split("(");
  var type = parse[0];
  var args = parse[1].split(")")[0].split(",");

  if (type === "playNote") {
    type = Midi.Event.NOTE_ON;
  } else if (type === "releaseNote") {
    type = Midi.Event.NOTE_OFF;
  }

  return {type: type, note: Number(args[0]), time: Number(args[1])};
}

module.exports = AStoMIDI;