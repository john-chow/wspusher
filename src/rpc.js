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
    logger.info(`RPC to broadcast! Project is ${project}, room is ${room}`);
    app.producer
        .broadcast(project, room, message)
        .catch(e => {
            logger.error(`RPC to broadcast fail! Project is ${project}, room is ${room}`);
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
    logger.info(`RPC to notify! Project is ${project}, userid is ${userid}`);
    let {message} = req.body;
    await app.producer
             .notice(project, userid, message)
             .catch(e => {
                logger.error(`RPC to notice fail! Project is ${project}, userId is ${userid}`);
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
    uids = JSON.parse(uids);
    logger.info(`RPC to join room! Project is ${project}, room is ${room}`);
    app.producer
        .joinRoom(project, room, uids)
        .catch(e => {
            logger.error(`RPC to join room fail! Project is ${project}, room is ${room}, userId is ${userid}`);
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
    logger.info(`RPC to leave room! Project is ${project}, room is ${room}`);
    app.producer
        .leaveRoom(project, room, userid)
        .catch(e => {
            logger.error(`RPC to leave room fail! Project is ${project}, room is ${room}, userId is ${userid}`);
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
        .catch(e => {
            logger.error(`RPC to clear room fail! Project is ${project}, room is ${room}`);
            code = e.code ? e.code : Constants.RESP_FAIL_UNKNOWN;
            msg = e.msg ? e.msg : msg;
        });
})

const Port = require('./config.json').rpcport;
http.listen(Port, function() {
  logger.info(`RPC Server Start! listening on *:${Port}`)
});