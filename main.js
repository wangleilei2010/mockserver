#!/usr/bin/env node

'use strict'
var express = require("express");
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require("path");
var routes = require('./routes');

var SessionStore = require("connect-mongo")(session);
var store = new SessionStore({
    url: "mongodb://localhost:27017/session",
    interval: 120000
});

var http = require("http");
var app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/pages"));

app.use(express.static(path.join(__dirname, "bower_components")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(session({
    secret: 'vamcc',
    store: store,
    cookie: {maxAge: 900000},
    resave: true,
    saveUninitialized: true
}));

app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next();
});

routes(app);

http.createServer(app).listen(8088);