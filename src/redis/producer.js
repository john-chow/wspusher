const redis = require('./redis');
const Config = require();

class Producer {
    constructor() {
        this.redisclient = redis.getClient();
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
    async broadcast(project, room, message) {
    }
}

module.exports = Producer;