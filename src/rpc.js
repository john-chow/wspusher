const Port = require('./config.json').rpcport;
var app = require('express')();
var http = require('http').Server(app);

const Producer = require('./redis/producer')
app.producer = new Producer();

app.get('/:project/broadcast', function(req, res) {
});

app.get('/:project/notice/:userid', function(req, res) {
});

app.get('/:project/join/:roomid', function(req, res) {
    let project = req.params.project,
        roomid = req.params.roomid;
    app.producer.joinRoom(project, roomid, userid);
});

app.get('/:project/leave/:roomid', function(req, res) {
    let project = req.params.project,
        roomid = req.params.roomid;
    app.producer.leaveRoom(project, roomid, userid);
})

http.listen(Port, function() {
  console.log(`listening on *:${Port}`);
});