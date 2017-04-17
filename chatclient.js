ChatClient = (function($) {
    var _defaultoptions = {};

    function ChatClient (options) {
        this.options = $.extend(true, _defaultoptions, options);

        this.socket = io.connect();
        this.user = null;
    }
    ChatClient.prototype = {
        newUser : function(nickname, callback) {
            if(!nickname)
                return false;

            if(this.user)
                this.disconnect();

            this.socket.emit("connect user", nickname, callback);
            this.user = nickname;
            return true;
        },

        isMyself : function(user) {
            return this.user === user;
        },

        disconnect : function(callback) {
            if(!this.user)
                return false;

            this.user = null;
            this.socket.emit("disconnect", callback);
        },

        userlist : function(callback) {
            this.socket.on("usernames", callback);
        },

        sendMessage : function(msg, callback) {
            if(!msg)
                return false;

            this.socket.emit("send message", msg, callback);
            return true;
        },

        receiveMessage : function(callback) {
            this.socket.on("message", callback);
        },

        receivePrivate : function (callback) {
            this.socket.on("private", callback);
        },

        receiveWhisper : function (callback) {
            this.socket.on("whisper", callback);
        }
    }
    return ChatClient;
})(jQuery);