const redis = require('./redis')
const Config = require('./../config.json');
const redisClient = redis.defaultClient

exports.incrConsumers = function (growth) {
    let key = redis.genStatsKey(project);
    redisClient.hincrby(key, 'consumers', growth);
}

exports.setConsumersStats = function (count) {
    let serverKey = redis.genStatsServerKey(project);
    redisClient.hset(serverKey, `${Config.rpcserver}:${Config.rpcport}`, count);
}
