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
        let [project, userids] = message.split('-');
        let ids = userids.split(',');
        ids.map((uid) => {
            pullMessage(project, uid)
        })
    });

exports.addConsumer = async (project, consumerId) => {
    let queuekey = redis.genQueuekey(project, consumerId);
    let res = await redisClient.lindex(queuekey, 0);
    if (!res)   redisClient.rpush(queuekey, '1')
    redisClient.expire(queuekey, Config.redisQueueExpires);
}

exports.addUserConsumer = async (project, userId, consumerId) => {
    let userkey = redis.genUserKey(project, userId);
    await (
        redisClient.sadd(userkey, consumerId),
        redisClient.expire(userkey, Config.redisRoomExpires)
    )
}

exports.removeUserConsumer = async (project, userId, consumerId) => {
    let userkey = redis.genUserKey(project, userId);
    redisClient.srem(userkey, consumerId);
}

function pullMessage(project, uid) {
    let queuekey = redis.genQueuekey(project, uid);
    let messages = messageClient.lrange(queuekey, 0, Config.DEFT_NUM_MESSAGES_TO_PULL);
    let socket = exports.userSocketMap[redis.genSocketkey(project, uid)];
    socket.emit(project, messages);
    messageClient.ltrim(queuekey, 0, messages.length);
}
exports.pullMessage = pullMessage
exports.userSocketMap = {}
