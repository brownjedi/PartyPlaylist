/**
 * Created by saikarthikreddyginni on 5/23/15.
 */

var express = require('express'); // Express web server framework
var utils = require('./../util/utils');
var router = express.Router();


router.get('/me', function (req, res) {
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    utils.getUserDetails(access_token, false, function (err, variables) {
        res.status(200).json(variables);
    });
});


router.get('/playlistTracks', function (req, res) {
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    utils.getTracks(access_token, function (err, variables) {
        res.status(200).json(variables);
    });
});


module.exports = router;