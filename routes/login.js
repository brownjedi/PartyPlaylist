var express = require('express'); // Express web server framework
var querystring = require('querystring');
var spotifyApi = require('./../util/spotify');
var utils = require('./../util/utils');
var stateKey = 'spotify_auth_state';
var router = express.Router();
var async = require('async');
var db = require('./../database/database');

var eventCollection = db.get('events');
var trackCollection = db.get('tracks');


router.get('/', function (req, res) {
    // use the access token to access the Spotify Web API
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    if (access_token != undefined) {
        res.redirect('/playboard');
    } else {
        res.clearCookie('user_id');
        res.clearCookie('spotify_access_token');
        res.clearCookie('spotify_refresh_token');
        res.render('login');
    }
});


router.get('/authenticate', function (req, res) {

    var state = utils.generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scopes = ['user-read-private', 'user-read-email'];
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
});


router.get('/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.clearCookie('user_id');
        res.clearCookie('spotify_access_token');
        res.clearCookie('spotify_refresh_token');
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        spotifyApi.authorizationCodeGrant(code)
            .then(function (data) {
                res.cookie('spotify_access_token', data.body['access_token']);
                res.cookie('spotify_refresh_token', data.body['refresh_token']);
                res.redirect('/playboard');
            }, function (err) {
                console.log(error);
                res.clearCookie('user_id');
                res.clearCookie('spotify_access_token');
                res.clearCookie('spotify_refresh_token');
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            });
    }
});


//router.use(function (req, res, next) {
//    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
//    if (access_token != undefined) {
//        next();
//    } else {
//        res.clearCookie('user_id');
//        res.clearCookie('spotify_access_token');
//        res.clearCookie('spotify_refresh_token');
//        res.redirect('/#' +
//            querystring.stringify({
//                error: 'invalid_token'
//            }));
//    }
//});

router.get('/user', function (req, res) {
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    utils.getUserDetails(access_token, true, function (err, variables) {
        if (variables != undefined) {
            if (req.xhr) {
                variables.ajaxRender = true;
            } else {
                variables.ajaxRender = false;
            }
            res.render('profile', variables);
        } else {
            res.clearCookie('user_id');
            res.clearCookie('spotify_access_token');
            res.clearCookie('spotify_refresh_token');
            res.redirect('/#' +
                querystring.stringify({
                    error: 'invalid_token'
                }));
        }
    });
});

router.get('/playboard', function (req, res) {

    // use the access token to access the Spotify Web API
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    utils.getUserDetails(access_token, true, function (err, variables) {
        if (variables != undefined) {
            res.cookie('user_id', variables.id);
            if (req.xhr) {
                variables.ajaxRender = true;
            } else {
                variables.ajaxRender = false;
            }
            res.render('playboard', variables);
        } else {
            res.clearCookie('user_id');
            res.clearCookie('spotify_access_token');
            res.clearCookie('spotify_refresh_token');
            res.redirect('/#' +
                querystring.stringify({
                    error: 'invalid_token'
                }));
        }
    });
});


router.get('/event', function (req, res, next) {

    var eventCode = req.query.eventId;

    if (eventCode == undefined || eventCode == "") {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    } else {
        // use the access token to access the Spotify Web API
        var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;

        var final_output = {};

        async.waterfall([
            function (callback) {
                utils.getUserDetails(access_token, true, callback);
            },
            function (result, callback) {
                if (result != undefined) {
                    res.cookie('user_id', result.id);
                    final_output = JSON.parse(JSON.stringify(result));
                    trackCollection.findOne({
                        eventId: trackCollection.id(eventCode)
                    }, {}, callback);
                } else {
                    res.clearCookie('user_id');
                    res.clearCookie('spotify_access_token');
                    res.clearCookie('spotify_refresh_token');
                    return res.redirect('/#' +
                        querystring.stringify({
                            error: 'invalid_token'
                        }));
                }
            }
        ], function (err, variables) {
            if (variables && variables.tracks) {
                final_output.tracks = variables.tracks;
            } else {
                final_output.tracks = [];
            }

            if (req.xhr) {
                final_output.ajaxRender = true;
            } else {
                final_output.ajaxRender = false;
            }
            res.render('event', final_output);
        });
    }
});


router.get('/refresh_token', function (req, res) {
    // requesting access token from refresh token
    var refresh_token = req.cookies ? req.cookies['spotify_refresh_token'] : null;
    if (refresh_token != undefined) {
        spotifyApi.setRefreshToken(refresh_token);
        spotifyApi.refreshAccessToken()
            .then(function (data) {
                var access_token = data.body['access_token'];

                // Need to Modify This

            }, function (err) {
                console.log('Could not refresh access token', err);
            });
    } else {
        res.clearCookie('user_id');
        res.clearCookie('spotify_access_token');
        res.clearCookie('spotify_refresh_token');
        res.redirect('/#' +
            querystring.stringify({
                error: 'invalid_token'
            }));
    }
});

router.get('/logout', function (req, res) {
    res.clearCookie('user_id');
    res.clearCookie('spotify_access_token');
    res.clearCookie('spotify_refresh_token');
    res.redirect('/');
});


module.exports = router;