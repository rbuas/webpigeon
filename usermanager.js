var _socket = require("socket.io");

var Log = require(ROOT_DIR + "/brain/log");
var User = require(ROOT_DIR + "/models/user");

module.exports = UserManager;
function UserManager (server) {
    var self = this;
    self.users = {};
    self.socketio = _socket(self.server);
}

UserManager.MESSAGE = {
    USERNAMES : "usernames",
    BROADCAST : "broadcast",
    WHISPER : "whisper",
    PRIVATE : "private"
};

var ES = new Error(User.ERRORMESSAGE);

UserManager.prototype.on = function(path, callback) {
    var self = this;
    self.socketio.on(path, callback);
}

UserManager.prototype.emit = function(event, msg) {
    var self = this;
    self.socketio.emit(event, msg);
}

UserManager.prototype.connectUser = function(socket, user, callback) {
    var self = this;
    if(!user || !socket) {
        if(callback) callback(ES.e(User.ERROR.USER_PARAMS));
        return;
    }
    if(self.users[user]) {
        if(callback) callback(ES.e(User.ERROR.USER_UNKNOW));
        return;
    }

    socket.user = user;
    self.users[user] = socket;

    if(callback) callback();

    updateUsers(self);
}

UserManager.prototype.disconnectUser = function(socket, callback) {
    var self = this;
    if(!socket) {
        if(callback) callback(ES.e(User.ERROR.USER_PARAMS));
        return;
    }

    if(!socket.user || !self.users[socket.user]) {
        if(callback) callback(ES.e(User.ERROR.USER_UNKNOW));
        return;
    }

    delete self.users[socket.user];
    updateUsers();
}

UserManager.prototype.sendMessage = function(socket, message) {
    var self = this;
    if(!socket || !socket.user || !message) {
        if(callback) callback(ES.e(User.ERROR.USER_PARAMS));
        return;
    }

    //verify private message
    var startDest = message.substr(0,1) === '@';
    var endDestIndex = message.indexOf(' ');
    var dest = startDest && endDestIndex ? message.substring(1, endDestIndex) : null;
    var error;
    if(dest) {
        message = message.substr(endDestIndex + 1);
        if(!message) {
            if(callback) callback(ES.e(User.ERROR.USER_UNKNOW));
            return;
        }

        error = sendPrivateMessage(self, socket.user, dest, message);
    } else {
        error = sendBroadcast(self, socket.user, message);
    }
    if(error && callback) callback(error);
}


// PRIVATE

function updateUsers (self) {
    if(!self)
        return;

    self.emit(UserManager.MESSAGE.USERNAMES, Object.keys(self.users));
}


function sendBroadcast (self, origin, message) {
    if(!origin || !message)
        return ES.e(User.ERROR.USER_PARAMS);

    self.emit(UserManager.MESSAGE.BROADCAST, {origin:origin, message:message});
}

function sendPrivateMessage (self, origin, dest, message) {
    if(!self)
        return;

    if(!origin || !dest || !message)
        return ES.e(User.ERROR.USER_PARAMS);

    var destSocket = self.users[dest];
    if(!destSocket)
        return ES.e(User.ERROR.USER_UNKNOW);

    destSocket.emit(UserManager.MESSAGE.WHISPER, {origin:origin, dest:dest, message:message});

    var originSocket = self.users[origin];
    if(!originSocket)
        return ES.e(User.ERROR.USER_UNKNOW);

    originSocket.emit(UserManager.MESSAGE.PRIVATE, {origin:origin, dest:dest, message:message});
}