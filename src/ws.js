const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Producer = require('./redis/producer');
const logger = require('./service/logger');
const jwt = require('jsonwebtoken');

const redis = require('./redis/redis');
var redisClient = redis.defaultClient;
var consumer = require('./redis/consumer');
const producer = new Producer(redisClient);
const Constants = require('./utils/constant');

io.on('connection', async function(socket) {
  let consumerId = socket.id;
  let {project, token} = socket.handshake.query,
      ready = true,
      userid;

  project = 'WspusherDemo';
  userid = 2;

/*
  let decoded;
  try {
    decoded = jwt.verify(token, Constants.TOKEN_SECRET);
  } catch (err) {
    logger.warn(`Token verify fail! token is ${token}`);
    socket.emit('token-unauth');
    socket.disconnect(true);
    return;
  }
  userid = decoded.userid;
*/

  socket.ioPending = false;
  await Promise.all([
    consumer.addConsumer(project, consumerId),
    consumer.addUserConsumer(project, userid, consumerId),
    producer.joinRoom(project, 'APP', [userid])
  ]).catch(e => {
    logger.error(`Consumer connect fail! project is ${project}, userid is ${userid}, exception is ${e}`);
    socket.disconnect(true);
    ready = false;
  });
  if (!ready)   return;
  logger.info(`Consumer Connected! id is ${consumerId}`);

  await consumer
    .pullMessage(project, consumerId)
    .catch(e => {
      logger.error(`pull init message fail! project is ${project}, userid is ${userid}`);
    });

  socket
    .on('ping', () => {
      consumer.updateConsumer(project, userid, consumerId)
    })
    .once('disconnect', () => {
      logger.info(`Consumer Disconnect! project is ${project}, userid is ${userid}, consumerid is ${consumerId}`);
      consumer.removeUserConsumer(project, userid, consumerId);
      consumer.removeConsumer(project, consumerId);
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

process.on('uncaughtException', function (e) {
  logger.error(`WS uncaught exception! e is ${e}`);
  process.exit();
});
/* Ctrl+c的退出; PM2官方说明restart事件 */
process.on('SIGINT', () => {
  logger.warn('Ws process Get SIGINT event!')
  io.close(() => {
    logger.warn('Ws server close successfully!');
    process.exit(0);
  });
})
/* nodemon的自动restart */
process.on('SIGUSR2', () => {
  logger.warn('Ws process Get SIGUSR2 event!')
  io.close(() => {
    gracefulShutdown(function () {
      process.kill(process.pid, 'SIGUSR2');
    });
  })
})

process.on('message', (message) => {
  logger.warn('Ws process get shutdown!');
  if (message == 'shutdown') {
    logger.warn('Ws will shutdown!');
    io.close(() => {
      process.exit(0);
    });
  }
})

const Port = require('./config.json').wsport;
http.listen(Port, function(){
  logger.info(`Ws Server Start! listening on *:${Port}`)
});
