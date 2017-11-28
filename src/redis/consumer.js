const redis = require('./redis')

const redisclient = redis.defaultClient
const subscribeClient = redis.getClient()

subscribeClient.on('message', (channel, userids) => {
    if (channel !== redis.channel)  return;
    ids = userids.split(',');
    ids.map(pullMessage)
})

function pullMessage(uid) {
}