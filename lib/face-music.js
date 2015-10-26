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

FaceMusic.prototype.getTempo = function() {
  var measurement = "lengthToWidthRatio";

  return parseInt(scaleWindow(this[measurement](), {
    top: faceStats[measurement].max,
    bottom: faceStats[measurement].min
  }, {
    top: 110,
    bottom: 70
  }), 10);
};

function scaleWindow(number, fromWindow, toWindow) {
  var fromWindowSize = fromWindow.top - fromWindow.bottom;
  var locInWindow = (number - fromWindow.bottom) / fromWindowSize;
  var toWindowSize = toWindow.top - toWindow.bottom;
  return toWindow.bottom + (locInWindow * toWindowSize)
}

module.exports = FaceMusic;