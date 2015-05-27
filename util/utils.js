/**
 * Created by saikarthikreddyginni on 5/23/15.
 */

var spotifyApi = require('./../util/spotify');
var db = require('./../database/database.js');
var async = require('async');

var eventCollection = db.get('events');

module.exports = {
    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    generateRandomString: function (length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    },

    getTracks: function (access_token, callback) {
        spotifyApi.setAccessToken(access_token);
        async.waterfall([
            function (callback) {
                spotifyApi.getPlaylistTracks('saikarthik027', '3mDgin6mINNlcQXj6AyGyt')
                    .then(function (data) {
                        //console.log(data);
                        //console.log("\n\n");
                        //console.log(data.body);
                        callback(null, data);
                    }, function (err) {
                        console.error(err);
                        callback(err);
                    });
            }
        ], callback);
    },

    getUserDetails: function (access_token, return_null, callback) {
        var variables = {};
        variables.id = "johndoe";
        variables.name = "John Doe";
        variables.image = 'images/avatar04.png';
        variables.country = "US";
        variables.email = "john.doe@crazypeople.com";
        variables.product = "unknown";
        variables.events = undefined;

        async.waterfall([
            function (callback) {
                if (access_token != undefined) {
                    spotifyApi.setAccessToken(access_token);
                    spotifyApi.getMe()
                        .then(function (data) {
                            // we can also pass the token to the browser to make requests from there
                            var body = data.body;

                            variables.id = body.id;
                            if (body.display_name == undefined) {
                                variables.name = body.id;
                            } else {
                                variables.name = body.display_name;
                            }

                            if (body.images != undefined && body.images.length > 0) {
                                variables.image = body.images[0].url
                            }

                            if (body.external_urls && body.external_urls.spotify) {
                                variables.spotify_link = body.external_urls.spotify
                            }

                            variables.country = body.country;
                            variables.email = body.email;
                            variables.product = body.product;
                            callback(null, variables);
                        }, function (err) {
                            console.log(err);
                            variables.id = "johndoe";
                            variables.name = "John Doe";
                            variables.image = 'images/avatar04.png';
                            variables.country = "US";
                            variables.email = "john.doe@crazypeople.com";
                            variables.product = "unknown";
                            variables.events = undefined;
                            if (return_null) {
                                callback(null, null);
                            } else {
                                callback(null, variables);
                            }
                        });
                } else {
                    if (return_null) {
                        callback(null, null);
                    } else {
                        callback(null, variables);
                    }
                }
            }, function (variables, callback) {
                if (variables && variables.id != "johndoe") {
                    eventCollection.find({
                        userId: variables.id
                    }, {}, function (err, res) {
                        variables.events = res;
                        callback(null, variables);
                    });
                } else {
                    if (return_null) {
                        callback(null, null);
                    } else {
                        callback(null, variables);
                    }
                }
            }
        ], callback);
    },

    isEmpty: function (obj) {
        // null and undefined are "empty"
        if (obj == null) return true;

        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length && obj.length > 0) return false;
        if (obj.length === 0) return true;

        // Otherwise, does it have any properties of its own?
        // Note that this doesn't handle
        // toString and toValue enumeration bugs in IE < 9
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }
        return true;
    }
};