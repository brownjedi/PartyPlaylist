var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('PartyPlaylist:server');

var http = require('http');
var io = require('socket.io');
var login = require('./routes/login');
var api = require('./routes/api');
var utils = require('./util/utils');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));


/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '8888');
app.set('port', port);

/**
 * Create HTTP server.
 */

//app.post('/addTrack', function (req, res) {
//    //var partyCode = req.query.partyCode;
//    var partyCode = 'HURRAY1';
//    var json = JSON.parse(JSON.stringify(req.body));
//
//    if (partyCode == undefined || partyCode == "") {
//        return res.status(400).json({
//            "Error": [{
//                "status": 400,
//                "message": "A valid party code is required!"
//            }]
//        });
//    } else if(!json.previewUrl || !json.name || !json.albumImage || !json.artistName){
//        return res.status(400).json({
//            "Error": [{
//                "status": 400,
//                "message": "The fields previewUrl, name, albumImage and artistName must be present in the JSON body"
//            }]
//        });
//    } else {
//        async.waterfall([
//            function (callback) {
//                eventCollection.findOne({
//                    eventCode: partyCode
//                }, {}, callback);
//            },
//            function (result, callback) {
//                if (result) {
//                    trackCollection.update({
//                        eventId: result._id
//                    }, {"$push": {tracks: json}}, callback);
//                }
//            }
//        ], function (err, result) {
//            if (err) {
//                return res.status(500).json({
//                    "Error": [{
//                        "status": 500,
//                        "message": err
//                    }]
//                });
//            } else {
//                io.emit('message', json);
//                return res.status(201).json({
//                    "success": 1
//                });
//            }
//        });
//    }
//});

var server = http.createServer(app);
io = io.listen(server);

io.sockets.on('connection', function(socket){
    console.log("Hurray");
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);

server.on('error', onError);
server.on('listening', onListening);

app.use('/', login);
app.use('/api/v1', api);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') !== 'development') {
    app.use(function (err, req, res, next) {
        if (req.xhr) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err,
                status: err.status,
                ajaxRender: true
            });
        } else {
            next(err);
        }
    });

    app.use(function (err, req, res, next) {
        var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
        utils.getUserDetails(access_token, false, function (err1, data) {
            data.message = err.message;
            data.error = err;
            data.status = err.status;
            data.ajaxRender = false;
            res.status(err.status || 500);
            res.render('error', data);
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    if (req.xhr) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {},
            status: err.status,
            ajaxRender: true
        });
    } else {
        next(err);
    }
});

app.use(function (err, req, res, next) {
    var access_token = req.cookies ? req.cookies['spotify_access_token'] : null;
    utils.getUserDetails(access_token, false, function (err1, data) {
        data.message = err.message;
        data.error = {};
        data.status = err.status;
        data.ajaxRender = false;
        res.status(err.status || 500);
        res.render('error', data);
    });
});

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number testing
        return port;
    }
    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

module.exports = app;