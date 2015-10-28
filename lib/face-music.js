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

FaceMusic.prototype.getKey = function() {
  var measurement = "lengthToWidthRatio";

  return mapToBucket(this[measurement](), [0,1,2,3,4,5,6,7,8,9,10,11], faceStats[measurement]);
};

function mapToBucket(number, buckets, stats) {
  if (buckets === undefined || buckets.length < 1) throw new Error("No buckets!");
  if (buckets.length == 1) return buckets[0];

  if (buckets.length == 2) return number <= stats.percentile[50] ? buckets[0] : buckets[1];

  if (number < stats.min) return buckets[0];
  if (number > stats.max) return buckets[buckets.length-1];
  for (var i = 1; i <= buckets.length-2; i++) {
    if (number <= stats.percentile[parseInt(i*(100/(buckets.length - 2)))]) return buckets[i];
  }
}

function scaleWindow(number, fromWindow, toWindow) {
  var fromWindowSize = fromWindow.top - fromWindow.bottom;
  var locInWindow = (number - fromWindow.bottom) / fromWindowSize;
  var toWindowSize = toWindow.top - toWindow.bottom;
  return toWindow.bottom + (locInWindow * toWindowSize)
}

module.exports = FaceMusic;