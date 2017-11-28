var express = require('express')
var app = express()
const http = require('http')

const ProjectName = 'WspusherDemo'

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
})

app.get('/emit', function(req, res) {
    http.get({
        host:   'localhost',
        port:   8090,
        method: 'GET'
    }, (res) => {
    })
})

app.get('/broadcast', function(req, res) {
    http.get({
        host:   'localhost',
        port:   8090,
        method: 'GET'
    }, (res) => {
    })
})

app.listen(3000);