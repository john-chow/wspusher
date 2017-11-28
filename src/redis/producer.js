const redis = require('./redis');
const Config = require();

class Producer {
    constructor() {
        this.redisclient = redis.getClient();
    }
    async broadcast(project, room, message) {
        let roomkey = genRoomkey(room);
        let users = await [];
        users.map((uid) => {
            let queuekey = genQueueKey(uid);
            this.redisclient.rpushx(queuekey, message);
        })
        await this.redisclient.publish(redis.CHANNEL, users.join(','))
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