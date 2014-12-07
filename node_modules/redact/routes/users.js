var express = require('express');
var router = express.Router();
var asp = require('asp');

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('ASP Version: ' + asp.version);
});

module.exports = router;
