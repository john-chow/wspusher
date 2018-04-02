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
  let ready = true;
  await Promise.all([
    consumer.addConsumer(project, consumerId),
    consumer.addUserConsumer(project, userid, consumerId),
    producer.joinRoom(project, '', userid)
  ]).catch(e => {
    logger.error(`Consumer connect fail! project is ${project}, userid is ${userid}`);
    socket.close();
    ready = false;
  });
  if (!ready)   return;

  await consumer
    .pullMessage(project, consumerId)
    .catch(e => {
      logger.error(`pull init message fail! project is ${project}, userid is ${userid}`);
    });

  socket
    .on('heartbeat', () => {
      logger.info('heartbeat......');
      consumer.updateConsumer(project, userid, consumerId)
    })
    .once('disconnect', () => {
      logger.info(`Consumer Disconnect! project is ${project}, userid is ${userid}`);
      consumer.removeUserConsumer(project, userid, consumerId);
    })
    .once('error', (error) => {
      logger.error(`Consumer connect error! project is ${project}, userid is ${userid}, reason is ${error}`);
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
