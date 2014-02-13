#!/bin/env node

var ipaddr  = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port    = process.env.OPENSHIFT_NODEJS_PORT || 8080;

var express = require('express'),
    http = require('http'),
    path = require('path'),
    main = require('./main'),
    app = express();

app.use(express.logger("dev"));

app.use(express.bodyParser({
    uploadDir: __dirname + '/uploads',
    keepExtensions: true
}));

app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, './uploads')));

app.post('/records', main.addRecord); // endpoint to post new record
app.get('/records', main.getRecords); // endpoint to get list of records

http.createServer(app).listen(port, ipaddr);
