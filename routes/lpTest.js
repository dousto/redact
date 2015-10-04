var express = require('express');
var router = express.Router();
var path = require('path');
var Clingo = require('clingojs');
var Sampler = require('weighted-reservoir-sampler');

var AStoMIDI = require('../lib/as-to-midi');

/* GET users listing. */
router.get('/', chords);
router.get('/test', scale);
router.get('/asToMidi', asToMidi);
router.get('/:numChords', chords);

function asToMidi(req, res) {
  var asToMidi = new AStoMIDI();
  res.send(asToMidi.test());
}

function chords(req, res) {
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

function scale(req, res) {

  var Midi = require('jsmidgen');

  var file = new Midi.File();
  var track = new Midi.Track();
  file.addTrack(track);

  track.setTempo(60);
  track.setInstrument(1, 0, 0);
  track.addNote(1, 'c4', 64);
  track.addNote(1, 'd4', 64);
  track.addNote(1, 'e4', 64);
  track.addNote(1, 'f4', 64);
  track.addNote(1, 'g4', 64);
  track.addNote(1, 'a4', 64);
  track.addNote(1, 'b4', 64);
  track.addNote(1, 'c5', 64);

  var byteBuffer = new Buffer(file.toBytes(), 'binary');

  res.status(200)
    .set({
    'Content-Type': 'audio/mp3',
    'Content-Length': byteBuffer.length
  });
    //.send(byteBuffer);

  var stream = require('stream');

  var byteStream = new stream.PassThrough();
  byteStream.end(byteBuffer);

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
}

module.exports = router;
