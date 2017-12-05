const redis = require('./redis')
const Config = require('./../config.json')

const redisclient = redis.defaultClient
const subscribeClient = redis.getClient()
const messageClient = redis.getClient()

subscribeClient
    .subscribe(redis.Channel, (message) => {
        let [project, userids] = message.split('-');
        let ids = userids.split(',');
        ids.map((uid) => {
            pullMessage(project, uid)
        })
    })

function pullMessage(project, uid) {
    let queuekey = redis.genQueuekey(project, uid);
    let messages = messageClient.lrange(queuekey, 0, Config.DEFT_NUM_MESSAGES_TO_PULL);
    let socket = exports.userSocketMap[redis.genSocketkey(project, uid)];
    socket.emit(project, messages);
    messageClient.ltrim(queuekey, 0, messages.length);
}
exports.pullMessage = pullMessage
exports.userSocketMap = {}
