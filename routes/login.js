var express = require('express'); // Express web server framework
var querystring = require('querystring');
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: 'b5e5d4fce3cb438091089c2d7103ffc9', // Your client id
    clientSecret: '330630a2b9fa44f7ae0a8533967ed2ee', // Your client secret
    redirectUri: 'http://localhost:8888/callback' // Your redirect uri
});

var stateKey = 'spotify_auth_state';
var router = express.Router();


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

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

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scopes = ['user-read-private', 'user-read-email'];
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
});


router.get('/me', function (req, res) {
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    if (access_token != undefined) {
        spotifyApi.setAccessToken(access_token);
        spotifyApi.getMe()
            .then(function (data) {
                // we can also pass the token to the browser to make requests from there
                var body = data.body;
                var variables = {};
                variables.id = body.id;
                if (body.display_name == undefined) {
                    variables.name = body.id;
                } else {
                    variables.name = body.display_name;
                }

                if (body.images == undefined || body.images.length == 0) {
                    variables.image = 'images/avatar04.png'
                } else {
                    variables.image = body.images[0].url
                }

                variables.country = body.country;
                variables.email = body.email;
                variables.product = body.product;

                res.status(200).json(variables);
            }, function (err) {
                var variables = {};
                variables.id = "johndoe";
                variables.name = "John Doe";
                variables.image = 'images/avatar04.png';
                variables.country = "US";
                variables.email = "john.doe@crazypeople.com";
                variables.product = "unknown";
                res.status(200).json(variables);
            });
    } else {
        var variables = {};
        variables.id = "johndoe";
        variables.name = "John Doe";
        variables.image = 'images/avatar04.png';
        variables.country = "US";
        variables.email = "john.doe@crazypeople.com";
        variables.product = "unknown";
        res.status(200).json(variables);
    }
});

router.get('/playboard', function (req, res) {

    // use the access token to access the Spotify Web API
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    if (access_token != undefined) {
        spotifyApi.setAccessToken(access_token);
        spotifyApi.getMe()
            .then(function (data) {
                // we can also pass the token to the browser to make requests from there
                var body = data.body;
                var variables = {};
                variables.id = body.id;
                if (body.display_name == undefined) {
                    variables.name = body.id;
                } else {
                    variables.name = body.display_name;
                }

                if (body.images == undefined || body.images.length == 0) {
                    variables.image = 'images/avatar04.png'
                } else {
                    variables.image = body.images[0].url
                }

                variables.country = body.country;
                variables.email = body.email;
                variables.product = body.product;

                res.cookie('user_id', body.id);


                spotifyApi.getUserPlaylists(body.id)
                    .then(function (data) {
                        console.log('Retrieved playlists', data.body);
                    }, function (err) {
                        console.log('Something went wrong!', err);
                    });


                res.render('playboard', variables);
            }, function (err) {
                res.clearCookie('user_id');
                res.clearCookie('spotify_access_token');
                res.clearCookie('spotify_refresh_token');
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
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