const Config = require('./../config.json')
let Redis = require('ioredis');

exports.getClient = () => {
    let client = new Redis(Config.redis);
    return client;
}

exports.genRoomkey = (project, room) => {
    return `${project}:R:${room}`
}

exports.genUserKey = (project, userid) => {
    return `${project}:U:${userid}`
}

exports.genQueuekey = (project, socketid) => {
    return `${project}:Q:${socketid}`
}

exports.Channel = `${Config.channel}:message`
exports.defaultClient = exports.getClient();