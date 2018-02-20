const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Producer = require('./redis/producer');

const redis = require('./redis/redis');
var redisClient = redis.defaultClient;
var consumer = require('./redis/consumer');
const producer = new Producer(redisClient);

io.on('connection', async function(socket) {
  let consumerId = socket.id;
  console.log(`Ws Connected! socket id is ${consumerId}`);
  let {project, userid} = socket.handshake.query;
  await Promise.all([
    consumer.addConsumer(project, consumerId),
    consumer.addUserConsumer(project, userid, consumerId),
    producer.joinRoom(project, '', userid)
  ]);
  await consumer.pullMessage(project, consumerId);
});

Object.defineProperty(consumer, "socketsMap", {
  get:  () => {
    return io.sockets.sockets || {}; 
  }
})

const Port = require('./config.json').wsport;
http.listen(Port, function(){
  console.log(`listening on *:${Port}`);
});