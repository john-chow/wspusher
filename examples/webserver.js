var express = require('express')
var app = express()
const http = require('http')
const qs = require('querystring'); 
const axios = require('axios');
const request = require('request');
const rp = require('request-promise');
const jwt = require('jsonwebtoken');
const Constants = require('./../src/utils/constant');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/static', express.static('./examples'));

const Config = require('./../src/config.json')
const ProjectName = 'WspusherDemo'

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
})

app.post('/emit', async function(req, res) {
    let {content, uid} = req.body,
        code = Constants.RESP_SUCCESS;
    /*
    await rp({
        url: `http://${Config.rpcserver}:${Config.rpcport}/${ProjectName}/notice/${uid}`,
        method: 'post',
        headers: {
            forever: true
        },
        json: {
            message: content
        }
    }).catch(e => {
        console.log(`Webserver emit error! e is ${e}`);
        code = '000001';
    })
    */

    await axios({
        baseURL:    `http://${Config.rpcserver}:${Config.rpcport}`,
        url:        `/${ProjectName}/notice/${uid}`,
        method:     'post',
        httpAgent: new http.Agent({ keepAlive: true }),
        data: {
            message:    content
        }
    }).catch(e => {

        console.log(`Webserver emit error! e is ${e}`);
        code = '000001';
    });
    res.status(200).send({code});
})

app.post('/joinroom/:room', async (req, res) => {
    let room = req.params.room,
        {uids} = req.body;
    await axios({
        baseURL:    `http://${Config.rpcserver}:${Config.rpcport}`,
        url:        `/${ProjectName}/join/${room}`,  
        method:     'post',
        data:   {
            uids
        }
    })
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

app.post('/signin', (req, res) => {
    let {userid} = req.body;
    let token = jwt.sign({userid}, Constants.TOKEN_SECRET);
    res.status(200).send({token});
})

app.listen(3000)
//http.createServer(app).listen(3000);