const Config = require('./../config.json')
Redis = require('./../../mock/Redis');

exports.getClient = () => {
    let client = new Redis();
    return client;
}

exports.genRoomkey = (project, room) => {
    return `${project}:R:${room}`
}

exports.genQueuekey = (project, userid) => {
    return `${project}:Q:${userid}`
}

exports.genSocketkey = (project, userid) => {
    return `${project}:S:${userid}`
}

exports.Channel = `${Config.channel}:message`