/*
 * 模拟Redis功能，用于单元测试
 */
const EventEmitter = require('events')

class Redis {
    constructor() {
    }

    rpushx(key, value) {
        Redis.queue.push(value);
    }

    publish(channel, message) {
        Redis.emitter.emit(channel, message)
    }

    subscribe(channel, fn) {
        Redis.emitter.on(channel, fn)
    }

    hset(key, field, value) {
        Redis.map[field] = value;
    }

    hdel(key, field) {
        delete Redis.map[field];
    }

    del(key, field) {
        delete Redis.map[field];
    }

    lrange(key, start, end) {
        console.log(Redis.queue);
        return Redis.queue.slice(start, end);
    }

    ltrim(key, start, stop) {
        let num = stop - start;
        Redis.queue.splice(start, num);
    }

    expire() {
    }
}
Redis.emitter = new EventEmitter();
Redis.queue = [];
Redis.map = {};

module.exports = Redis;