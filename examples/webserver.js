var express = require('express')
var app = express()
const http = require('http')
const qs = require('querystring'); 

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const Config = require('./../src/config.json')
const ProjectName = 'WspusherDemo'

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
})

app.post('/emit', function(req, res) {
    let {content} = req.body;
    let r = http.request({
        host:   Config.rpcserver,
        port:   Config.rpcport,
        path:   `/${ProjectName}/notice/1`,
        method: 'POST',
        headers: {  
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'  
        }
    }, (res) => {
        console.log(res.statusCode);
    })
    let contentstr = qs.stringify({
        message:  content
    });
    r.write(contentstr);
    r.end();
    res.status(200).send();
})

app.get('/broadcast', function(req, res) {
    http.get({
        host:   'localhost',
        port:   8090,
        method: 'GET'
    }, (res) => {
    })
})

http.createServer(app).listen(3000);