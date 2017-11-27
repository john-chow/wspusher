const Redis = require();

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

exports.genChannel = (project) => {
    return `${project}:message`
}