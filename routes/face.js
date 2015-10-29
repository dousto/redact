var express = require('express');
var router = express.Router();
var seedrandom = require('seedrandom');
var debug = require('debug')('redact-face');
var multer = require('multer');
var FaceMusic = require('../lib/face-music');
var SongGenerator = require('../lib/song-generator');
var Stats = require('fast-stats').Stats;
var upload = multer();

router.get('/', face);
router.post('/', upload.array('files'), postFace);
router.get('/ui', ui);
router.post('/ui', upload.array('files'), postUi);
router.post('/stats', upload.array('files'), stats);

function getParamObj(p, face) {
  var paramObj = {
    id: p.id,
    f: p.f,
    ci: p.ci,
    mi: p.mi,
    k: p.k,
    t: p.t
  };

  if (face) {
    if (paramObj.k === undefined) paramObj.k = face.getKey();
    if (paramObj.t === undefined) paramObj.t = face.getTempo();
  }

  return paramObj;
}

function paramObjToQuery(p) {
  var parr = [];
  for (var prop in p) {
    if (p.hasOwnProperty(prop) && p[prop] !== undefined) {
      parr.push(prop + '=' + encodeURIComponent(p[prop]));
    }
  }

  return parr.join('&');
}

function ui(req, res) {
  res.render('redact-face', {
    id: req.query.id,
    file: req.query.f,
    chordsInstrument: req.query.ci,
    melodyInstrument: req.query.mi,
    key: req.query.k,
    tempo: req.query.t
  });
}

function postUi(req, res) {
  if (req.files.length >= 1) {
    var fileData = parse(req.files);
    var theFace = new FaceMusic({measurements: fileData[0]});
    var params = getParamObj(req.body, theFace);
    params.id = fileData[0].join(",");
    params.f = encodeURIComponent(req.files[0].originalname);
    res.redirect('?' + paramObjToQuery(params));
  } else {
    throw new Error("Must provide a file!");
  }
}

function face(req, res) {
  if (!req.query.id) throw new Error("Must provide face ID!");
  var measurements = req.query.id.split(",").map(function(n) { return Number(n); });
  var theFace = new FaceMusic({measurements: measurements});
  var params = getParamObj(req.query, theFace);
  var vel = require('../lib/velocities');
  var songGen = new SongGenerator({
    rng: seedrandom(params.id),
    tempo: Math.max(parseInt(params.t, 10), 30),
    key: parseInt(params.k, 10),
    chordsInstrument: parseInt(params.ci, 10),
    chordsVelocityAdjust: vel.chords[parseInt(params.ci, 10)],
    melodyInstrument: parseInt(params.mi, 10),
    melodyVelocityAdjust: vel.melody[parseInt(params.mi, 10)]
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
        if (Boolean(req.query.download)) res.set({'Content-Disposition': 'attachment; filename=' + (req.query.f ? req.query.f.replace(/\.[^\.]{0,10}/g, '')+'.mp3' : 'face.mp3')});
        mp3Stream.pipe(res);
      });
    });
  });
}

function postFace(req, res) {
  if (req.files.length >= 1) {
    var fileData = parse(req.files);
    new FaceMusic({measurements: fileData[0]});
    var idParam = fileData[0].join(",");
    res.redirect('?download=true&id=' + idParam);
  } else {
    throw new Error("Must provide a file!");
  }
}

function parse(reqFiles) {
  var files = [];
  reqFiles.forEach(function(file) {
    var measurements = [];
    var fileString = file.buffer.toString('ucs2');
    var lines = fileString.split('\n');
    lines.forEach(function(line) {
      var splitLine = line.split('\t');
      if (splitLine.length > 5){
        var measurement = splitLine[5].replace(/"/g, "");
        if (!isNaN(Number(measurement))) measurements.push(Number(measurement));
      }
    });
    files.push(measurements);
  });

  return files;
}

function stats(req, res) {
  var fileData = parse(req.files);
  var funcs = [];
  funcs.push({"name": "lengthToWidthRatio", "alg": function(data) {
    var face = new FaceMusic({measurements: data});

    return face.lengthToWidthRatio();
  }});

  var stats = {};
  funcs.forEach(function(func) {
    var s = new Stats();
    fileData.forEach(function(data) {
      s.push(func.alg(data))
    });

    stats[func.name] = {
      "min": s.range()[0],
      "max": s.range()[1],
      "avg": s.amean(),
      "σ": s.σ(),
      "percentile": {}
    };

    for(var i = 1; i <= 100; i++) {
      stats[func.name].percentile[""+i] = s.percentile(i);
    }
  });

  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(stats));
}

module.exports = router;
