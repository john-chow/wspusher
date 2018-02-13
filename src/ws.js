const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Producer = require('./redis/producer');

const redis = require('./redis/redis');
var redisClient = redis.defaultClient;
var consumer = require('./redis/consumer');
const producer = new Producer(redisClient);

io.on('connection', async function(socket) {
  console.log(`Ws Connected! socket id is ${socket.id}`);
  let {project, userid} = socket.handshake.query;
  await consumer.addConsumer(project, socket.id);
  await producer.joinRoom(
    project, `user-${userid}`, socket.id
  );
  await consumer.addUserConsumer(project, userid, socket.id);
});

const Port = require('./config.json').wsport;
http.listen(Port, function(){
  console.log(`listening on *:${Port}`);
});