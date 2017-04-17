var _log = require("../brain/log");

var _users = {};
var _error = {
    1 : {errorcode: 1, errormessage:"missing parameters"},
    2 : {errorcode: 2, errormessage:"unknow user"},
    3 : {errorcode: 3, errormessage:"private message empty"}
};

module.exports.connectUser = function(socket, user, callback) {
    if(!user || !socket) {
        if(callback) callback(_error[1]);
        return;
    }
    if(_users[user]) {
        if(callback) callback(_error[2]);
        return;
    }

    socket.user = user;
    _users[user] = socket;

    if(callback) callback();

    updateUsers();
}

module.exports.disconnectUser = function(socket, callback) {
    if(!socket) {
        if(callback) callback(_error[1]);
        return;
    }

    if(!socket.user || !_users[socket.user]) {
        if(callback) callback(_error[2]);
        return;
    }

    delete _users[socket.user];
    updateUsers();
}

function updateUsers () {
    brain.emit("usernames", Object.keys(_users));
}

module.exports.sendMessage = function(socket, message) {
    if(!socket || !socket.user || !message) {
        if(callback) callback(_error[1]);
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
            if(callback) callback(_error[3]);
            return;
        }

        error = sendPrivateMessage(socket.user, dest, message);
    } else {
        error = sendBroadcast(socket.user, message);
    }
    if(error && callback) callback(error);
}

function sendBroadcast (origin, message) {
    if(!origin || !message)
        return _error[1];

    brain.emit("message", {origin:origin, message:message});
}

function sendPrivateMessage (origin, dest, message) {
    if(!origin || !dest || !message)
        return _error[1];

    var destSocket = _users[dest];
    if(!destSocket)
        return _error[2];

    destSocket.emit("whisper", {origin:origin, dest:dest, message:message});

    var originSocket = _users[origin];
    if(!originSocket)
        return _error[2];

    originSocket.emit("private", {origin:origin, dest:dest, message:message});
}