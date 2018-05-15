const redis = require('./redis');
const Config = require('./../config.json');
const Constants = require('./../utils/constant');
const logger = require('./../service/logger');

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
                received_consumers = received_consumers.concat(consumers);
            } else {
                let userMsgKey = redis.genUserMsgKey(project, uid);
                await this.redisclient.rpushx(userMsgKey, message);
            }
        }, this);
        await Promise.all(p);
        if (received_consumers.length > 0) {
            let rc = received_consumers.join(Config.consumerSplitter);
            await this.redisclient.publish(
                redis.Channel, 
                `${project}${Config.projectConsumerSpliter}${rc}`
            ).then(() => {
                logger.info(`Producer broadcast success! project is ${project}`);
            });
        } else {
            logger.info(`Producer broadcast but no consumers! project is ${project}`);
        }
    }
    /*
     * 定向用户推送消息
     * 如果用户有端socket在线连接，推送到socket；否则，暂存user队列
     */
    async notice(project, userId, message) {
        let userRoomKey = redis.genUsRoomkey(project, userId);
        let consumer_list = await this.redisclient.smembers(userRoomKey);
        if (consumer_list.length > 0) {
            let pip = this.redisclient.pipeline();
            consumer_list.forEach(cid => {
                let qk = redis.genQueuekey(project, cid);
                pip.rpushx(qk, message)
            });
            await pip.exec().then(() => {
                logger.info(`Producer notice success! project is ${project}, userId is ${userId}, message is ${message}`);
            }).catch(e => {
                logger.error(`Producer notice fail! project is ${project}, userId is ${userId}, exception is ${e}`);
                throw new Error({
                    code: Constants.RESP_REDIS_TRANSACTION,
                    msg: '保存通知信息失败!'
                });
            });
            let socketid_list_str = consumer_list.join(`${Config.consumerSplitter}`);
            this.redisclient.publish(
                redis.Channel, 
                `${project}${Config.projectConsumerSpliter}${socketid_list_str}`
            );
        } else {
            let userMsgKey = redis.genUserMsgKey(project, userId);
            console.log(`Push user message is ${message}`);
            await this.redisclient.rpush(userMsgKey, message);
        }
    }
    async joinRoom(project, room, uids=[]) {
        let roomkey = redis.genRoomkey(project, room);
        let pip = this.redisclient.pipeline();
        uids.forEach(uid => {
            pip.hset(roomkey, uid, 1);
            pip.expire(roomkey, Config.redisQueueExpires)
        });
        return await pip.exec().then(() => {
            logger.info(`Producer joinroom success! project is ${project}, room is ${room}, uids is ${uids}`);
        }).catch(e => {
            logger.error(`Producer joinroom fail! project is ${project}, room is ${room}, uids is ${uids}, exception is ${e}`);
        })
    }
    async leaveRoom(project, room, uids=[]) {
        let roomkey = redis.genRoomkey(project, room);
        let pip = this.redisclient.pipeline();
        uids.forEach(uid => {
            pip.hdel(roomkey, uid)
        });
        return await pip.exec().then(() => {
            logger.info(`Producer leaveroom success! project is ${project}, room is ${room}, uids is ${uids}`);
        }).catch(e => {
            logger.error(`Producer leaveroom fail! project is ${project}, room is ${room}, uids is ${uids}, exception is ${e}`);
        })
    }
    async clearRoom(project, room) {
        let roomkey = redis.genRoomkey(project, room);
        return await this.redisclient.del(roomkey).then(() => {
            logger.info(`Producer clearroom success! project is ${project}, room is ${room}`);
        }).catch(e => {
            logger.error(`Producer clearroom fail! project is ${project}, room is ${room}, exception is ${e}`);
        });
    }
}

module.exports = Producer;