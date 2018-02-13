const redis = require('./redis');
const Config = require('./../config.json');

class Producer {
    constructor() {
        this.redisclient = redis.getClient();
    }
    async broadcast(project, room, message) {
        let roomkey = redis.genRoomkey(project, room);
        let users = await [];
        let sockets = [];
        sockets.map((socketid) => {
            let queuekey = redis.genQueuekey(project, socketid);
            this.redisclient.rpushx(queuekey, message);
        })
        await this.redisclient.publish(redis.Channel, sockets.join(','))
    }
    notice(project, userid, message) {
        let queuekey = redis.genQueuekey(project, userid);
        this.redisclient.rpushx(queuekey, message);
        this.redisclient.publish(redis.Channel, `${project}-${userid}`);
    }
    async joinRoom(project, room, userid) {
        let roomkey = redis.genRoomkey(project, room);
        let res = await [
            this.redisclient.hset(roomkey, userid, 1),
            this.redisclient.expire(roomkey, Config.redisQueueExpires)
        ];
        return res[0];
    }
    async leaveRoom(project, room, userid) {
        let roomkey = redis.genRoomkey(project, room);
        await this.redisclient.hdel(roomkey, userid);
    }
    clearRoom(project, room) {
        let roomkey = redis.genRoomkey(project, room);
        return this.redisclient.del(roomkey);
    }
}

module.exports = Producer;