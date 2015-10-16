var ChordGen = require('../lib/chords');
var ChordVoicing = require('../lib/chord-voicing');
var Melody = require('../lib/melody');
var AStoMIDI = require('../lib/as-to-midi');
var stream = require('stream');
var debug = require('debug')('redact');

var SongGenerator = function(config) {
  config = config || {};
  this.rng = config.rng;
};

SongGenerator.prototype.generate = function(number, callback) {
  var config = {rng: this.rng};
  var chordGen = new ChordGen(config);
  var chordVoicing = new ChordVoicing(config);
  var melody = new Melody(config);

  var numChords = number/8;
  chordGen.generate(numChords, function(chords) {
    chordVoicing.generate(numChords, chords, function(chordNotes) {
      melody.generate(number-1, chords, function(melodyNotes) {
        callback({
          chordNotes: chordNotes,
          melodyNotes: melodyNotes
        });
      });
    });
  });
};

SongGenerator.prototype.convertToMidi = function(song, callback) {

  var Midi = require('midijs');
  var File = Midi.File;

  var file = new Midi.File();

  file.getHeader().setTicksPerBeat(128);
  file.addTrack([new File.MetaEvent(File.MetaEvent.TYPE.SET_TEMPO, {
    tempo: 80
  })])
    .addTrack([new File.MetaEvent(File.MetaEvent.TYPE.SET_TEMPO, {
      tempo: 80
    })]);
  var chordTrack = file.getTrack(0);
  var melodyTrack = file.getTrack(1);

  var asToMidi = new AStoMIDI();
  debug('Build chord midi events');
  var chordEvents = asToMidi.convertToMidiEvents(song.chordNotes, { scale: 4*128, channel: 0 });
  chordEvents.forEach(function(event) {
    chordTrack.addEvent(event)
  });
  debug('Build melody midi events');
  var melodyEvents = asToMidi.convertToMidiEvents(song.melodyNotes, { scale: 64, channel: 1 });
  melodyEvents.forEach(function(event) {
    melodyTrack.addEvent(event)
  });
  [chordTrack, melodyTrack].forEach(function (track) {
    track.addEvent(new File.MetaEvent(File.MetaEvent.TYPE.END_OF_TRACK))
  });

  file.getData(function(err, data) {
    var byteStream = new stream.PassThrough();
    byteStream.end(data);
    callback(byteStream);
  });
};

SongGenerator.prototype.render = function(midiStream, callback) {

  var spawn = require('child_process').spawn;

  var fs = require('fs');
  var uuid = require('uuid');
  var wavFile = uuid.v4();
  var timidity = spawn("timidity", ["-", "-A90a", "-Ow", "-o", wavFile, "--output-24bit"]);
  midiStream.pipe(timidity.stdin);
  timidity.on('exit', function() {
    var mp3File = uuid.v4() + ".mp3";
    var lame = spawn("lame", [wavFile, mp3File]);
    lame.on('exit', function() {
      fs.unlink(wavFile, function(){});
      fs.stat(mp3File, function(err, stats) {
        var mp3Stream = fs.createReadStream(mp3File);
        callback(mp3Stream, stats.size);
        mp3Stream.on('close', function() {
          fs.unlink(mp3File, function(){});
        })
      });
    });
  });
};

module.exports = SongGenerator;