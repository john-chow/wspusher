(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('socket.io-client'))
    } else if (typeof define === 'function' && define.amd) {
        define(['socket.io-client'], factory)
    } else {
        root.WspusherClient = factory(io);
    }
})(typeof window === 'object' ? window : this, function(io) {

    const DefaultOption = {
        reconnction:            true,
        reconnctionAttemps:     Infinity
    };

    function Client(url, options) {
        this.url = url;
        this.options = Object.assign(
            DefaultOption,
            options || {}
        );
        this.socket = null;
        this.connected = false;
        this._connect();
    }

    Client.prototype._connect = function() {
        this.socket = io(this.url, this.options);
        this.socket
            .on('connect',  this._onopen)
            .on('reconnect', this._onopen)
            .on('disconnect', this._onclose)
            .on('close', this._onclose)
            .on('error', this._onclose)
    }

    Client.prototype.request = function() {
        throw new Error('Not Implement!');
    }

    Client.prototype.on = function() {
        if (this.socket) {
            this.socket.on(...arguments);
        } else {
            throw new Error('Not Connected Yet!');
        }
    }

    Client.prototype._onopen = function() {
        console.log('...open...');
        this.connected = true;
    }

    Client.prototype._onclose = function() {
        console.log('...close...');
        this.connected = false;
    }

    Client.prototype.parse = function() {
    }

    return Client;
})