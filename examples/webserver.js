var express = require('express')
var app = express()
const http = require('http')
const qs = require('querystring'); 
const axios = require('axios');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/static', express.static('./examples'));

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

app.get('/joinroom/:roomid', async (req, res) => {
    res.status(200).send();
})

app.post('/broadcast', function(req, res) {
    let {content} = req.body;
    axios({
        baseURL:    `http://${Config.rpcserver}:${Config.rpcport}`,
        url:        `/${ProjectName}/broadcast`,  
        method:     'post',
        data:   {
            message:    content
        }
    });
    res.status(200).send();
})

app.listen(3000)
//http.createServer(app).listen(3000);