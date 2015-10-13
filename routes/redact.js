var express = require('express');
var router = express.Router();
var path = require('path');
var Clingo = require('clingojs');
var Sampler = require('weighted-reservoir-sampler');
var debug = require('debug')('redact');

var AStoMIDI = require('../lib/as-to-midi');

/* GET users listing. */
//router.get('/', chords);
//router.get('/scale', scale);
router.get('/play/song/:numChords', song);
//router.get('/test', scale);
//router.get('/asToMidi', asToMidi);
//router.get('/:numChords', chords);

function asToMidi(req, res) {
  var asToMidi = new AStoMIDI();
  res.send(asToMidi.test());
}

function chords_OLD(req, res) {
    var clingo = new Clingo().config({
        maxModels: 0
    });

//    var models = [];
    var sampler = new Sampler();

    clingo.solve({
        inputFiles: [path.resolve(__dirname, '../lp/music'),
            path.resolve(__dirname, '../lp/rhythm'),
            path.resolve(__dirname, '../lp/progression'),
            path.resolve(__dirname, '../lp/chord_voicing')],
        constants: { m: req.params.numChords || 2 },
        //constants: { from: 0, to: 2 },
        input: ['#show playNote/2', '#show releaseNote/2']
    })
        .on('model', function(model) {
            sampler.push(model);
        })
        .on('end', function() {
            res.type('json');
            res.send(JSON.stringify(sampler.end()));
        })
}

function chords(req, res) {
  var ChordGen = require('../lib/chords');
  var chordGen = new ChordGen();
  var ChordVoicing = require('../lib/chord-voicing');
  var chordVoicing = new ChordVoicing();

  var numChords = req.params.numChords || 2;
  chordGen.generate(numChords, function(chords) {
    debug("Progression result: " + chords);
    chordVoicing.generate(numChords, chords, function(notes) {
      res.type('json');
      res.send(JSON.stringify(notes));
    });
  })
}

function song(req, res) {

  var ChordGen = require('../lib/chords');
  var chordGen = new ChordGen();
  var ChordVoicing = require('../lib/chord-voicing');
  var chordVoicing = new ChordVoicing();
  var Melody = require('../lib/melody');
  var melody = new Melody();

  var numChords = req.params.numChords || 2;
  chordGen.generate(numChords, function(chords) {
    chordVoicing.generate(numChords, chords, function(chordNotes) {
      melody.generate(numChords*8-1, chords, function(melodyNotes) {
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
        var chordEvents = asToMidi.convertToMidiEvents(chordNotes, { scale: 4*128, channel: 0 });
        chordEvents.forEach(function(event) {
          chordTrack.addEvent(event)
        });
        debug('Build melody midi events');
        var melodyEvents = asToMidi.convertToMidiEvents(melodyNotes, { scale: 64, channel: 1 });
        melodyEvents.forEach(function(event) {
          melodyTrack.addEvent(event)
        });
        [chordTrack, melodyTrack].forEach(function (track) {
          track.addEvent(new File.MetaEvent(File.MetaEvent.TYPE.END_OF_TRACK))
        });

        file.getData(function(err, data) {
          var stream = require('stream');
          var byteStream = new stream.PassThrough();
          byteStream.end(data);

          var spawn = require('child_process').spawn;

          var fs = require('fs');
          var uuid = require('uuid');
          var wavFile = uuid.v4();
          var timidity = spawn("timidity", ["-", "-A90a", "-Ow", "-o", wavFile, "--output-24bit"]);
          byteStream.pipe(timidity.stdin);
          timidity.on('exit', function() {
            var mp3File = uuid.v4() + ".mp3";
            var lame = spawn("lame", [wavFile, mp3File]);
            lame.on('exit', function() {
              fs.unlink(wavFile, function(){});
              res.download(mp3File, "myfile.mp3", function(err) {
                if (err) {
                  res.send(err);
                } else {
                  fs.unlink(mp3File, function(){});
                }
              });
            });
          });
        });
      });
    });
  })
}

function scale(req, res) {

  var Midi = require('midijs');
  var File = Midi.File;

  var file = new Midi.File();

  file.getHeader().setTicksPerBeat(128);
  file.addTrack().addTrack();
  var track = file.getTrack(0);
  var track2 = file.getTrack(1);
  track.addEvent(new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_ON, {
    note: 60
  }, 0, 0));
  track.addEvent(new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_OFF, {
    note: 60
  }, 0, 128));
  track.addEvent(new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_ON, {
    note: 60
  }, 0, 0));
  track.addEvent(new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_OFF, {
    note: 60
  }, 0, 128));
  track.addEvent(new File.MetaEvent(File.MetaEvent.TYPE.END_OF_TRACK));
  track2.addEvent(new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_ON, {
    note: 65
  }, 1, 0));
  track2.addEvent(new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_OFF, {
    note: 65
  }, 1, 128));
  track2.addEvent(new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_ON, {
    note: 65
  }, 1, 0));
  track2.addEvent(new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_OFF, {
    note: 65
  }, 1, 128));
  track2.addEvent(new File.MetaEvent(File.MetaEvent.TYPE.END_OF_TRACK));

  file.getData(function(err, data) {
    res.status(200)
      .set({
        'Content-Type': 'audio/mp3',
        'Content-Length': data.length
      });
    //.send(byteBuffer);

    var stream = require('stream');

    var byteStream = new stream.PassThrough();
    byteStream.end(data);

    var spawn = require('child_process').spawn;

    var fs = require('fs');
    var uuid = require('uuid');
    var wavFile = uuid.v4();
    var timidity = spawn("timidity", ["-", "-A90a", "-Ow", "-o", wavFile, "--output-24bit"]);
    byteStream.pipe(timidity.stdin);
    timidity.on('exit', function() {
      var mp3File = uuid.v4() + ".mp3";
      var lame = spawn("lame", [wavFile, mp3File]);
      lame.on('exit', function() {
        fs.unlink(wavFile, function(){});
        res.download(mp3File, "myfile.mp3", function(err) {
          if (err) {
            res.send(err);
          } else {
            fs.unlink(mp3File, function(){});
          }
        });
      });
    });
  })

}

module.exports = router;
