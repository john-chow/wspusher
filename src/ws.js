const Port = require('./config.json').wsport;
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(Port, function(){
  console.log(`listening on *:${Port}`);
});