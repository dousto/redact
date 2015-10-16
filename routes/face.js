var express = require('express');
var router = express.Router();
var seedrandom = require('seedrandom');
var debug = require('debug')('redact');

router.get('/', face);

function face(req, res) {
  if (!req.query.id) throw new Error("Must provide face ID!");
  var seed = req.query.id;

  var SongGenerator = require('../lib/song-generator');
  var songGen = new SongGenerator({
    rng: seedrandom(seed)
  });

  debug("Begin song generation");
  var numChords = req.query.length || 4;
  songGen.generate(numChords*8, function(song) {
    songGen.convertToMidi(song, function(midiStream) {
      songGen.render(midiStream, function(mp3Stream, length) {
        res.status(200)
          .set({
            'Content-Type': 'audio/mp3',
            'Content-Length': length
          });
        if (Boolean(req.query.download)) res.set({'Content-Disposition': 'attachment; filename=song.mp3'});
        mp3Stream.pipe(res);
      });
    });
  });
}

module.exports = router;
