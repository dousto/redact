var express = require('express');
var router = express.Router();
var path = require('path');
var Clingo = require('clingojs');

/* GET users listing. */
router.get('/', function(req, res) {
    var clingo = new Clingo().config({
        maxModels: 0
    });

    var models = new Array();

    clingo.solve({
        inputFiles: path.resolve(__dirname, '../lp/rhythm'),
        constants: { from: 0, to: 1}
    })
        .on('model', function(model) {
            models.push(model);
        })
        .on('end', function() {
            res.type('json');
            res.send(JSON.stringify(models));
        })
});

module.exports = router;
