var app = require('express')();
var http = require('http').Server(app);
const logger = require('./service/logger');
const Constants = require('./utils/constant');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const Producer = require('./redis/producer')
app.producer = new Producer();

app.post('/:project/broadcast', function(req, res) {
    let project = req.params.project,
        {room, message} = req.body,
        code = Constants.RESP_SUCCESS,
        msg = '';
    room = room || '';
    app.producer
        .broadcast(project, room, message)
        .then(() => {
            logger.info(`RPC to broadcast success! Project is ${project}, room is ${room}`);
        })
        .catch(e => {
            logger.error(`RPC to broadcast fail! Project is ${project}, room is ${room}, exception is ${e}`);
            code = e.code ? e.code : Constants.RESP_FAIL_UNKNOWN;
            msg = e.msg ? e.msg : msg;
        });
    res.status(200).send({code, msg});
});

app.post('/:project/notice/:userid', async function(req, res) {
    let project = req.params.project,
        userid = req.params.userid,
        code = Constants.RESP_SUCCESS,
        msg = '';
    let {message} = req.body;
    await app.producer
             .notice(project, userid, message)
             .then(() => {
                logger.info(`RPC to notice success! Project is ${project}, userid is ${userid}`);
             })
             .catch(e => {
                logger.error(`RPC to notice fail! Project is ${project}, userid is ${userid}, exception is ${e}`);
                code = e.code ? e.code : Constants.RESP_FAIL_UNKNOWN;
                msg = e.msg ? e.msg : msg;
             });
    res.status(200).send({code, msg});
});

app.post('/:project/join/:room', function(req, res) {
    let project = req.params.project,
        room = req.params.room,
        code = Constants.RESP_SUCCESS,
        msg = '',
        {uids} = req.body;
    _uids = JSON.parse(uids);
    app.producer
        .joinRoom(project, room, _uids)
        .then(() => {
            logger.info(`RPC to join room success! Project is ${project}, room is ${room}, uids is ${uids}`);
        })
        .catch(e => {
            logger.error(`RPC to join room fail! Project is ${project}, room is ${room}, uids is ${uids}, exception is ${e}`);
            code = e.code ? e.code : Constants.RESP_FAIL_UNKNOWN;
            msg = e.msg ? e.msg : msg;
        });
    res.status(200).send({code, msg});
});

app.post('/:project/leave/:room', function(req, res) {
    let project = req.params.project,
        room = req.params.room,
        code = Constants.RESP_SUCCESS,
        msg = '';
    app.producer
        .leaveRoom(project, room, userid)
        .then(() => {
            logger.info(`RPC to leave room success! Project is ${project}, room is ${room}, userid is ${userid}`);
        })
        .catch(e => {
            logger.error(`RPC to leave room fail! Project is ${project}, room is ${room}, userid is ${userid}, exception is ${e}`);
            code = e.code ? e.code : Constants.RESP_FAIL_UNKNOWN;
            msg = e.msg ? e.msg : msg;
        });
    res.status(200).send({code, msg});
});

app.post('/:project/clear/:room', async function(req, res) {
    let project = req.params.project,
        room = req.params.room,
        code = Constants.RESP_SUCCESS,
        msg = '';
    await app.producer
        .clearRoom(project, room)
        .then(() => {
            logger.info(`RPC to clear room success! Project is ${project}, room is ${room}`);
        })
        .catch(e => {
            logger.error(`RPC to clear room fail! Project is ${project}, room is ${room}, exception is ${e}`);
            code = e.code ? e.code : Constants.RESP_FAIL_UNKNOWN;
            msg = e.msg ? e.msg : msg;
        });
})

process.on('uncaughtException', function (e) {
    logger.error(`RPC uncaught exception! e is ${e}`);
});

const Port = require('./config.json').rpcport;
http.listen(Port, function() {
  logger.info(`RPC Server Start! listening on *:${Port}`)
});