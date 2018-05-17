const redis = require('./redis')
const Config = require('./../config.json')
const logger = require('./../service/logger');

const redisClient = redis.defaultClient
const subscribeClient = redis.getClient()
const messageClient = redis.getClient()

subscribeClient.subscribe(redis.Channel);
subscribeClient.on('message', (channel, message) => {
        logger.info(`Consumer receive msg ${message} from channle ${channel}`);
        let [project, c] = message.split(`${Config.projectConsumerSpliter}`);
        let consumers = c.split(`${Config.consumerSplitter}`);
        consumers.map(cid => 
            pullMessage(project, cid).catch(e => {
                logger.error(`Pull message fail! project is ${project}, cid is ${cid}, e is ${e}`);
            })
        );
    });

exports.addConsumer = async (project, consumerId) => {
    let queuekey = redis.genQueuekey(project, consumerId);
    let res = await redisClient.lindex(queuekey, 0);
    if (!res)   await redisClient.rpush(queuekey, '1');
    await redisClient.expire(queuekey, Config.redisQueueExpires);
}

/*
 * 用户新增端连接
 */
exports.addUserConsumer = async (project, userId, consumerId) => {
    let userRoomKey = redis.genUsRoomkey(project, userId);
    await Promise.all([
        redisClient.sadd(userRoomKey, consumerId),
        redisClient.expire(userRoomKey, Config.redisRoomExpires)
    ]);
    // 用户暂存的消息，发送到端队列
    let userMsgKey = redis.genUserMsgKey(project, userId);
    let messages = await messageClient.lrange(userMsgKey, 0, Config.DEFT_NUM_MESSAGES_TO_PULL);
    if (messages.length > 0) {
        let queuekey = redis.genQueuekey(project, consumerId);
        await redisClient.rpush(queuekey, ...messages);
        await messageClient.ltrim(userMsgKey, messages.length, -1);
    }
}

exports.updateConsumer = async (project, userId, consumerId) => {
    let userRoomKey = redis.genUsRoomkey(project, userId);
    await Promise.all([
        exports.addUserConsumer(project, userId, consumerId),
        redisClient.expire(userRoomKey, Config.redisRoomExpires)
    ])
}

exports.removeUserConsumer = async (project, userId, consumerId) => {
    let userRoomKey = redis.genUsRoomkey(project, userId);
    await redisClient.srem(userRoomKey, consumerId);
}

exports.removeConsumer = async (project, consumerId) => {
    let queuekey = redis.genQueuekey(project, consumerId);
    await redisClient.del(queuekey);
}

async function pullMessage(project, consumerId) {
    let queuekey = redis.genQueuekey(project, consumerId);
    // queuekey在index0的位置，有个哨兵值；因为空list会被自动移除的
    let messages = await messageClient.lrange(queuekey, 1, Config.DEFT_NUM_MESSAGES_TO_PULL);
    let socket = exports.socketsMap[`${consumerId}`];
    if (!socket || socket.ioPending)    {
        console.log(`socket is ${socket}, ioPending is ${socket && socket.ioPending}`);
        return;
    }
    if (messages && messages.length>0) {
        socket.ioPending = true;
        socket.emit(project, messages, async (x) => {
            await messageClient.ltrim(queuekey, messages.length, -1);
            socket.ioPending = false;
            pullMessage(...arguments);
        });
    }
}
exports.pullMessage = pullMessage
