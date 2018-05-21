const Config = require('./../config.json')
const logger = require('./../service/logger');
let Redis = require('ioredis');

exports.getClient = () => {
    let c = Object.assign(
        {}, 
        Config.redis, 
        {
            // 断线重连策略
            retryStrategy: function (times) {
                var delay = Math.min(times * 50, 2000);
                return delay;
            }
        }
    );
    let client = new Redis(c);
    client.on('connect', () => {
        logger.info(`Connect redis success: ${Config.redis.host}:${Config.redis.port}`);
    }).on('reconnecting', () => {
        logger.error(`Reconnecting redis: ${Config.redis.host}:${Config.redis.port}`);
    });
    return client;
}

exports.genRoomkey = (project, room) => {
    return `${project}:R:${room}`
}

exports.genUsRoomkey = (project, userId) => {
    return exports.genRoomkey(project, `user${userId}`);
}

exports.genUserMsgKey = (project, userid) => {
    return `${project}:S:${userid}`
}

exports.genQueuekey = (project, socketid) => {
    return `${project}:Q:${socketid}`
}

exports.genStatsKey = project => {
    return `${project}:STATS`
}

exports.genStatsServerKey = project => {
    return `${project}:STATS:SERVERS`
}

exports.Channel = `${Config.channel}:message`
exports.defaultClient = exports.getClient();