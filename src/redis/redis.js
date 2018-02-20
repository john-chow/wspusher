const Config = require('./../config.json')
let Redis = require('ioredis');

exports.getClient = () => {
    let client = new Redis(Config.redis);
    return client;
}

exports.genRoomkey = (project, room) => {
    room = room || '';
    return `${project}:R:${room}`
}

exports.genUsRoomkey = (project, userId) => {
    return exports.genRoomkey(project, `user-${userId}`);
}

exports.genUserMsgKey = (project, userid) => {
    return `${project}:S:${userid}`
}

exports.genQueuekey = (project, socketid) => {
    return `${project}:Q:${socketid}`
}

exports.Channel = `${Config.channel}:message`
exports.defaultClient = exports.getClient();