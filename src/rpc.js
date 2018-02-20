var app = require('express')();
var http = require('http').Server(app);
const logger = require('./service/logger');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const Producer = require('./redis/producer')
app.producer = new Producer();

app.post('/:project/broadcast', function(req, res) {
    let project = req.params.project,
        {room, message} = req.body;
    room = room || '';
    logger.info(`RPC to broadcast! Project is ${project}, room is ${room}`);
    app.producer.broadcast(project, room, message);
});

app.post('/:project/notice/:userid', function(req, res) {
    let project = req.params.project,
        userid = req.params.userid;
    logger.info(`RPC to notify! Project is ${project}, userid is ${userid}`);
    let {message} = req.body;
    app.producer.notice(project, userid, message);
    res.status(200).send();
});

app.post('/:project/join/:room', function(req, res) {
    let project = req.params.project,
        room = req.params.room;
    logger.info(`RPC to join room! Project is ${project}, room is ${room}`);
    app.producer.joinRoom(project, room, userid);
});

app.post('/:project/leave/:room', function(req, res) {
    let project = req.params.project,
        room = req.params.room;
    logger.info(`RPC to leave room! Project is ${project}, room is ${room}`);
    app.producer.leaveRoom(project, room, userid);
})

const Port = require('./config.json').rpcport;
http.listen(Port, function() {
  logger.info(`RPC Server Start! listening on *:${Port}`)
});