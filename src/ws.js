const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Producer = require('./redis/producer');
const logger = require('./service/logger');

const redis = require('./redis/redis');
var redisClient = redis.defaultClient;
var consumer = require('./redis/consumer');
const producer = new Producer(redisClient);

io.on('connection', async function(socket) {
  let consumerId = socket.id;
  logger.info(`Consumer Connected! id is ${consumerId}`);
  let {project, userid} = socket.handshake.query;
  await Promise.all([
    consumer.addConsumer(project, consumerId),
    consumer.addUserConsumer(project, userid, consumerId),
    producer.joinRoom(project, '', userid)
  ]);
  await consumer.pullMessage(project, consumerId);

  socket
    .on('heartbeat', () => {
      console.log('heartbeat......');
      consumer.updateConsumer(project, userid, consumerId)
    })
    .once('disconnect', () => {
      logger.info(`Consumer Disconnect! id is ${consumerId}`);
      consumer.removeUserConsumer(project, userid, consumerId);
    })
    .once('error', (error) => {
      logger.error(`Consumer connect error! reason is ${error}`);
      socket.disconnect(true);
    })
});

Object.defineProperty(consumer, "socketsMap", {
  get:  () => {
    return io.sockets.sockets || {}; 
  }
})

const Port = require('./config.json').wsport;
http.listen(Port, function(){
  logger.info(`Ws Server Start! listening on *:${Port}`)
});