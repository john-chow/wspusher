var express = require('express')
var app = express()
const http = require('http')
const qs = require('querystring'); 
const axios = require('axios');
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
    await axios({
        baseURL:    `http://${Config.rpcserver}:${Config.rpcport}`,
        url:        `/${ProjectName}/notice/${uid}`,
        method:     'post',
        data: {
            message:    content
        }
    }).catch(e => {
        logger.error(``);
        code = '000001';
    });
    res.status(200).send({code});

    /*
    let r = http.request({
        host:   Config.rpcserver,
        port:   Config.rpcport,
        path:   `/${ProjectName}/notice/${uid}`,
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
    */
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
    console.log('joinroom response');
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