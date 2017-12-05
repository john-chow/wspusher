var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('./redis/redis')
var consumer = require('./redis/consumer');

io.on('connection', function(socket) {
  console.log('a user connected');
  let {project, userid} = socket.handshake.query;
  let key = redis.genSocketkey(project, userid);
  consumer.userSocketMap[key] = socket;
});

const Port = require('./config.json').wsport;
http.listen(Port, function(){
  console.log(`listening on *:${Port}`);
});