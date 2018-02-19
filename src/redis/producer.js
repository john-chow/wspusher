const redis = require('./redis');
const Config = require('./../config.json');

class Producer {
    constructor() {
        this.redisclient = redis.getClient();
    }
    async broadcast(project, room, message) {
        let socketid_list = [],
            roomkey = redis.genRoomkey(project, room),
            userid_list = await this.redisclient.hkeys(roomkey);
        let p = [];
        userid_list.forEach(async function(userid) {
            let userRoomKey = redis.genRoomkey(project, userid);
            let temp_socketid_list = await this.redisclient.hkeys(userRoomKey);
            temp_socketid_list.forEach((socketid) => {
                this.redisclient.rpushx(socketid, message);
            });
            socketid_list = socketid_list.concat(temp_socketid_list);
        }, this);
        let socketid_list_str = socketid_list.join(',');
        await this.redisclient.publish(redis.Channel, `${project}-${socketid_list_str}`);
    }
    /*
     * 定向用户推送消息
     * 如果用户有端socket在线连接，推送到socket；否则，暂存user队列
     */
    async notice(project, userId, message) {
        let userRoomKey = redis.genUsRoomkey(project, userId);
        let consumer_list = await this.redisclient.smembers(userRoomKey);
        if (consumer_list.length > 0) {
            let p = consumer_list.map(
                cid => this.redisclient.rpushx(
                    redis.genQueuekey(project, cid), message
                )
            );
            await Promise.all(p);
            let socketid_list_str = consumer_list.join(`${Config.consumerSplitter}`);
            await this.redisclient.publish(
                redis.Channel, 
                `${project}${Config.projectConsumerSpliter}${socketid_list_str}`
            );
        } else {
            let userMsgKey = redis.genUserMsgKey(project, userId);
            this.redisclient.rpushx(userMsgKey, message);
        }
    }
    async joinRoom(project, room, userid) {
        let roomkey = redis.genRoomkey(project, room);
        let res = await Promise.all([
            this.redisclient.hset(roomkey, userid, 1),
            this.redisclient.expire(roomkey, Config.redisQueueExpires)
        ]);
        return res;
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