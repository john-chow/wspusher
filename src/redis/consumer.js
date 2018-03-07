const redis = require('./redis')
const Config = require('./../config.json')

const redisClient = redis.defaultClient
const subscribeClient = redis.getClient()
const messageClient = redis.getClient()

subscribeClient
    .subscribe(redis.Channel)
    .then((err, count) => {
    });
subscribeClient
    .on('message', (channel, message) => {
        let [project, c] = message.split(`${Config.projectConsumerSpliter}`);
        let consumers = c.split(`${Config.consumerSplitter}`);
        consumers.map(cid => pullMessage(project, cid));
    });

exports.addConsumer = async (project, consumerId) => {
    let queuekey = redis.genQueuekey(project, consumerId);
    let res = await redisClient.lindex(queuekey, 0);
    if (!res)   redisClient.rpush(queuekey, '1');
    redisClient.expire(queuekey, Config.redisQueueExpires);
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

async function pullMessage(project, consumerId) {
    let queuekey = redis.genQueuekey(project, consumerId);
    let messages = await messageClient.lrange(queuekey, 1, Config.DEFT_NUM_MESSAGES_TO_PULL);
    let socket = exports.socketsMap[`${consumerId}`];
    if (socket && messages && messages.length>0) {
        socket.emit(project, messages);
        await messageClient.ltrim(queuekey, messages.length, -1);
    }
}
exports.pullMessage = pullMessage
