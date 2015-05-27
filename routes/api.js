/**
 * Created by saikarthikreddyginni on 5/23/15.
 */

var express = require('express'); // Express web server framework
var utils = require('./../util/utils');
var db = require('./../database/database');
var spotifyApi = require('./../util/spotify');
var async = require('async');
var router = express.Router();
var app = require('./../app');

var eventCollection = db.get('events');
var trackCollection = db.get('tracks');


router.get('/me', function (req, res) {
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    utils.getUserDetails(access_token, false, function (err, variables) {
        res.status(200).json(variables);
    });
});


router.get('/validate', function (req, res) {

    var partyCode = req.query.partyCode;

    if (partyCode == undefined || partyCode == "") {
        return res.status(400).json({
            "Error": [{
                "status": 400,
                "message": "A valid party code is required!"
            }]
        });
    } else {
        async.waterfall([
            function (callback) {
                eventCollection.findOne({
                    eventCode: partyCode
                }, {}, callback);
            },
            function (result, callback) {
                var output;
                if (!result) {
                    output = 0;
                } else if (result.eventStatus != "ongoing") {
                    output = -1;
                } else {
                    output = 1;
                }
                callback(null, output);
            }
        ], function (err, result) {
            if (err) {
                return res.status(500).json({
                    "Error": [{
                        "status": 500,
                        "message": err
                    }]
                });
            } else {
                return res.status(200).json({
                    "success": result
                });
            }
        });
    }
});


router.get('/getTracks', function (req, res) {
    var partyCode = req.query.partyCode;

    if (partyCode == undefined || partyCode == "") {
        return res.status(400).json({
            "Error": [{
                "status": 400,
                "message": "A valid party code is required!"
            }]
        });
    } else {
        async.waterfall([
            function (callback) {
                eventCollection.findOne({
                    eventCode: partyCode
                }, {}, callback);
            },
            function (result, callback) {
                var output = [];
                if (result) {
                    trackCollection.findOne({
                        eventId: result._id
                    }, {}, callback);
                } else {
                    callback(null, output);
                }
            },
            function (result, callback) {
                if (result && result.tracks) {
                    callback(null, result.tracks);
                } else {
                    callback(null, []);
                }
            }
        ], function (err, result) {
            if (err) {
                return res.status(500).json({
                    "Error": [{
                        "status": 500,
                        "message": err
                    }]
                });
            } else {
                return res.status(200).json(result);
            }
        });
    }
});


router.get('/searchTracks', function (req, res) {
    var trackName = req.query.trackName;

    if (trackName == undefined || trackName == "") {
        return res.status(400).json({
            "Error": [{
                "status": 400,
                "message": "The Field trackName is required!"
            }]
        });
    } else {
        async.waterfall([
            function (callback) {
                spotifyApi.searchTracks(trackName)
                    .then(function (data) {
                        callback(null, data);
                    }, function (err) {
                        console.error(err);
                        callback(err);
                    });
            }
        ], function (err, result) {
            if (err) {
                return res.status(500).json({
                    "Error": [{
                        "status": 500,
                        "message": err
                    }]
                });
            } else {
                var output = [];
                if (result && result.body && result.body.tracks && result.body.tracks.items) {
                    output = parseSearchTracks(result.body.tracks.items);
                }
                return res.status(200).json(output);
            }
        });
    }
});

router.get('/users/:user_id/playlists/:playlist_id/tracks', function (req, res) {
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    utils.getTracks(access_token, function (err, variables) {
        if (err) {
            res.status(err.statusCode).json(err);
        }
        else {
            var output = [];
            if (variables && variables.body && variables.body.items) {
                output = parsePlaylistTracks(variables.body.items);
            }
            res.status(200).json(output);
        }
    });
});


function parseSearchTracks(tracks) {
    var output = [];

    if (tracks && tracks.length > 0) {
        for (var i = 0; i < tracks.length; i++) {
            var track = {};
            var temp = tracks[i];
            track.albumId = temp.album.id;
            track.albumName = temp.album.name;
            if (temp.album.images && temp.album.images.length > 0) {
                track.albumImage = temp.album.images[0].url;
            }

            if (temp.artists && temp.artists.length > 0) {
                track.artistName = temp.artists[0].name;
                track.artistId = temp.artists[0].id;
            }

            track.duration = temp.duration_ms;
            track.explicit = temp.explicit;
            track.popularity = temp.popularity;

            if (temp.external_urls && temp.external_urls.spotify) {
                track.spotifyUrl = temp.external_urls.spotify;
            }

            track.id = temp.id;
            track.name = temp.name;
            track.previewUrl = temp.preview_url;
            if (!utils.isEmpty(track)) {
                output.push(track);
            }
        }
    }
    return output;
}


router.post('/addTrack', function (req, res) {
    var partyCode = req.query.partyCode;
    var json = JSON.parse(JSON.stringify(req.body));

    if (partyCode == undefined || partyCode == "") {
        return res.status(400).json({
            "Error": [{
                "status": 400,
                "message": "A valid party code is required!"
            }]
        });
    } else if(!json.previewUrl || !json.name || !json.albumImage || !json.artistName){
        return res.status(400).json({
            "Error": [{
                "status": 400,
                "message": "The fields previewUrl, name, albumImage and artistName must be present in the JSON body"
            }]
        });
    } else {
        async.waterfall([
            function (callback) {
                eventCollection.findOne({
                    eventCode: partyCode
                }, {}, callback);
            },
            function (result, callback) {
                if (result) {
                    trackCollection.update({
                        eventId: result._id
                    }, {"$push": {tracks: json}}, callback);
                }
            }
        ], function (err, result) {
            if (err) {
                return res.status(500).json({
                    "Error": [{
                        "status": 500,
                        "message": err
                    }]
                });
            } else {
                //app.sendMessage(json);
                return res.status(201).json({
                    "success": 1
                });
            }
        });
    }
});

function parsePlaylistTracks(tracks) {
    var output = [];

    if (tracks && tracks.length > 0) {
        for (var i = 0; i < tracks.length; i++) {
            var track = {};
            var temp = tracks[i].track;
            track.albumId = temp.album.id;
            track.albumName = temp.album.name;
            if (temp.album.images && temp.album.images.length > 0) {
                track.albumImage = temp.album.images[0].url;
            }

            if (temp.artists && temp.artists.length > 0) {
                track.artistName = temp.artists[0].name;
                track.artistId = temp.artists[0].id;
            }

            track.duration = temp.duration_ms;
            track.explicit = temp.explicit;
            track.popularity = temp.popularity;

            if (temp.external_urls && temp.external_urls.spotify) {
                track.spotifyUrl = temp.external_urls.spotify;
            }

            track.id = temp.id;
            track.name = temp.name;
            track.previewUrl = temp.preview_url;
            if (!utils.isEmpty(track)) {
                output.push(track);
            }
        }
    }

    return output;
}


module.exports = router;