/**
 * Created by saikarthikreddyginni on 5/24/15.
 */
var monk = require('monk');
var config = require('./config.json');
var db = monk(config.host + '/' + config.dbname);

module.exports = db;