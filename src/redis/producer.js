const redis = require('./redis');
const Config = require('./../config.json');

class Producer {
    constructor() {
        this.redisclient = redis.getClient();
    }
    async broadcast(project, room, message) {
        let received_consumers = [],
            roomkey = redis.genRoomkey(project, room),
            users = await this.redisclient.hkeys(roomkey);
        let p = users.map(async uid => {
            let userRoomKey = redis.genUsRoomkey(project, uid);
            let consumers = await this.redisclient.smembers(userRoomKey);
            if (consumers.length > 0) {
                let pp = consumers.map(
                    cid => this.redisclient.rpushx(redis.genQueuekey(project, cid), message)
                );
                await Promise.all(pp);
                console.log(`consumers length is ${consumers.length}`);
                received_consumers = received_consumers.concat(consumers);
            } else {
                let userMsgKey = redis.genUserMsgKey(project, uid);
                await this.redisclient.rpushx(userMsgKey, message);
            }
        }, this);
        await Promise.all(p);
        console.log(`received consumers length is ${received_consumers.length}`);
        if (received_consumers.length > 0) {
            let rc = received_consumers.join(Config.consumerSplitter);
            await this.redisclient.publish(
                redis.Channel, 
                `${project}${Config.projectConsumerSpliter}${rc}`
            );
        }
        console.log('xyzasdadf');
        console.log(received_consumers);
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
    async joinRoom(project, room, key) {
        let roomkey = redis.genRoomkey(project, room);
        let res = await Promise.all([
            this.redisclient.hset(roomkey, key, 1),
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