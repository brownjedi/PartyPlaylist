var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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
 *  Detecting an AJAX route
 */


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
if (app.get('env') === 'development') {
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


module.exports = app;
