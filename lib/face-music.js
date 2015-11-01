var path = require('path');
var debug = require('debug')('face-music');
var faceStats = require('../lib/face-stats-snapshot');

function FaceMusic(config) {
  config = config || {};
  if (config.measurements && config.measurements.length === 10) {
    this.measurements = config.measurements;
    /*
    0. Chin to lower lip
    1. Lower lip to upper lip
    2. Upper lip to nose base
    3. Nose base to tear ducts
    4. Bridge ducts to top of brow
    5. Top of brow to hairline
    6. Pupil spacing (outside to outside)
    7. Mouth width
    8. Nostril (nose) width
    9. Cheek bone width
     */
  } else {
    throw new Error("Must provide 10 facial measurements!");
  }
}

FaceMusic.prototype.lengthToWidthRatio = function() {
  var m = this.measurements;
  return (m[0] + m[1] + m[2] + m[3] + m[4] + m[5])/m[9]
};

FaceMusic.prototype.pupilSpacingToCheekWidthRatio = function() {
  var m = this.measurements;
  return m[6]/m[9];
};

FaceMusic.prototype.noseAndMouthWidthToCheekWidthRatio = function() {
  var m = this.measurements;
  return (m[7]+m[9])/m[9];
};

FaceMusic.prototype.eyesToFaceLengthRatio = function() {
  var m = this.measurements;
  return (m[4] + m[5])/(m[0] + m[1] + m[2] + m[3] + m[4] + m[5]);
};

FaceMusic.prototype.getTempo = function() {
  var measurement = "lengthToWidthRatio";

  return parseInt(scaleWindow(this[measurement](), {
    top: faceStats[measurement].max,
    bottom: faceStats[measurement].min
  }, {
    top: 130,
    bottom: 70
  }), 10);
};

FaceMusic.prototype.getKey = function() {
  var measurement = "eyesToFaceLengthRatio";

  return mapToBucket(
    this[measurement](),
    [0,1,2,3,4,5,6,7,8,9,10,11],
    {
      min: faceStats[measurement].min,
      max: faceStats[measurement].max
    });
};

FaceMusic.prototype.getChordsInstrument = function() {
  var measurement = "noseAndMouthWidthToCheekWidthRatio";

  return mapToBucket(
    this[measurement](),
    chordsInstruments(),
    {
      min: faceStats[measurement].min,
      max: faceStats[measurement].max
    }
  )
};

FaceMusic.prototype.getMelodyInstrument = function() {
  var measurement = "pupilSpacingToCheekWidthRatio";

  return mapToBucket(
    this[measurement](),
    melodyInstruments(),
    {
      min: faceStats[measurement].min,
      max: faceStats[measurement].max
    }
  )
};

function mapToBucket(number, buckets, range) {
  if (buckets === undefined || buckets.length < 1) throw new Error("No buckets!");
  if (buckets.length == 1) return buckets[0];

  if (number <= range.min) return buckets[0];
  if (number >= range.max) return buckets[buckets.length-1];

  var rangeWindow = range.max - range.min;
  return buckets[parseInt(((number - range.min)/rangeWindow)*buckets.length)];
}

function scaleWindow(number, fromWindow, toWindow) {
  var fromWindowSize = fromWindow.top - fromWindow.bottom;
  var locInWindow = (number - fromWindow.bottom) / fromWindowSize;
  var toWindowSize = toWindow.top - toWindow.bottom;
  return toWindow.bottom + (locInWindow * toWindowSize)
}

function chordsInstruments() {
  return [0,1,2,3,4,5,6,7,8,11,16,17,18,19,20,21,22,23,25,26,27,29,30,31,32,33,34,35,38,39,40,41,42,43,44,45,46,48,49,50,51,52,53,54,56,57,58,60,61,62,63,64,65,66,67,68,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,87,88,89,90,91,92,93,94,95,96,98,99,100,101,102,103,104,107,109,110,111,112,113,114];
}

function melodyInstruments() {
  return [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,48,49,50,51,52,53,54,56,57,58,59,60,61,62,63,64,65,66,67,68,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,87,88,89,90,91,92,93,94,95,96,98,99,100,101,102,103,104,105,106,107,108,110,111,112,113,114];
}

module.exports = FaceMusic;