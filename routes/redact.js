var express = require('express');
var router = express.Router();
var debug = require('debug')('redact');

router.get('/play/song/:numChords', song);

function song(req, res) {
  var SongGenerator = require('../lib/song-generator');
  var songGen = new SongGenerator();

  debug("Begin song generation");
  var numChords = req.params.numChords || 2;
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
