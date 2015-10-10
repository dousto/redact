var Midi = require('midijs');
var File = Midi.File;

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
    } else if (a.type == File.ChannelEvent.TYPE.NOTE_OFF && b.type == File.ChannelEvent.TYPE.NOTE_ON) {
      return -1;
    } else if (a.type == File.ChannelEvent.TYPE.NOTE_ON && b.type == File.ChannelEvent.TYPE.NOTE_OFF) {
      return 1;
    } else {
      return 0;
    }
  });

  var curtime = scale;
  var midiEvents = [];
  var debug = require('debug')('redact');
  events.forEach(function(event) {
    var time = scale + event.time * scale;
    debug("ChannelEvent(type: " + event.type + ", props: " + JSON.stringify({note:event.note}) + ", channel: " + (opts.channel || 0) + ", delay: " + (time == curtime ? 0 : time - curtime) + ")");
    midiEvents.push(new File.ChannelEvent(event.type, {
      note: event.note,
      velocity: 80
    }, opts.channel || 0, time == curtime ? 0 : time - curtime));

    curtime = time;
  });

  return midiEvents;
};

function parseEvent(event) {
  var parse = event.split("(");
  var type = parse[0];
  var args = parse[1].split(")")[0].split(",");

  if (type === "playNote") {
    type = File.ChannelEvent.TYPE.NOTE_ON;
  } else if (type === "releaseNote") {
    type = File.ChannelEvent.TYPE.NOTE_OFF;
  }

  return {type: type, note: Number(args[0]), time: Number(args[1])};
}

module.exports = AStoMIDI;