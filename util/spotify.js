/**
 * Created by saikarthikreddyginni on 5/23/15.
 */
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: 'b5e5d4fce3cb438091089c2d7103ffc9', // Your client id
    clientSecret: '2b98f1975519451fbc1ef9fa709484e3', // Your client secret
    redirectUri: 'http://localhost:8888/callback' // Your redirect uri
});

module.exports = spotifyApi;