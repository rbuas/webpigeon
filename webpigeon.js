module.exports = WebPigeon;

var socket = require("socket.io");
var moment = require("moment");
var nodemailer = require("nodemailer");

function WebPigeon (options) {
    var self = this;
    self.options = Object.assign(WebPigeon.DEFAULTOPTIONS, options) || {};
    self.transporter = nodemailer.createTransport(self.options.smtp);
    self.socket = socket(self.server);
    self.targets = {}; //index badgets by it's ids and session id ([id][sid] = badget)
    initListeners(self);
}

WebPigeon.DEFAULTOPTIONS = {
    smtp : {
        service : "MailGun",
        domaine : "fff.mailgun.org",
        api_key : "key-ffff",
        auth: {
            user: 'ffff',
            pass: 'ffff'
        }
    },
    messagemaker : function(outtype, template, data) {
        var message = "(" + template + "::" + JSON.parse(data) + ")"
        console.log("WEBPIGEON:", message);
        return message;
    },
    fake : null
}

WebPigeon.ERROR = {
    MISSING_PARAMS : "Missing function parameters",
    BADGET : "Missing badget id or session id",
    NOTCONNECTED : "Target not connected"
};

WebPigeon.EVENT = {
    NEWTARGET : "NEWTARGET",
    OLDTARGET : "OLDTARGET",
    BROADCAST : "BROADCAST",
    TARGETCAST : "TARGETCAST"
};

WebPigeon.prototype.set = function(badget) {
    var self = this;
    if(!badget || !badget.id || !badget.sid) return false;

    self.targets[badget.id] = self.targets[badget.id] || {};
    self.targets[badget.id][badget.sid] = badget;

    return true;
}

WebPigeon.prototype.get = function(id, sid) {
    var self = this;
    if(!id) return;

    if(!self.targets[id]) return;

    if(!sid) return self.target[id];

    return [self.target[id][sid]];
}

WebPigeon.prototype.targets = function() {
    var self = this;
    return self.targets;
}

WebPigeon.prototype.connect = function(socket) {
    var self = this;
    badget = Object.assign({}, badget);
    return new Promise(function(resolve, reject) {
        if(!socket || !socket.badget) return reject({error:WebPigeon.ERROR.MISSING_PARAMS, socket:socket});

        if(!self.set(socket.badget)) return reject({error:WebPigeon.ERROR.BADGET, badget:socket.badget});

        self.broadcast(WebPigeon.EVENT.NEWTARGET, socket.badget);
        resolve(badget);
    });
}

WebPigeon.prototype.disconnect = function(socket) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if(!socket) return reject({error:WebPigeon.ERROR.MISSING_PARAMS, socket:socket});

        if(!socket.badget || !socket.badget.id || !socket.badget.sid) return reject({error:WebPigeon.ERROR.BADGET, badget:socket.badget});

        if(!self.targets[socket.badget.id] || !self.targets[socket.badget.id][socket.badget.sid]) return reject({error:WebPigeon.ERROR.NOTCONNECTED, badget:socket.badget});

        delete self.targets[socket.badget.id][socket.badget.sid];

        self.broadcast(WebPigeon.EVENT.OLDTARGET, socket.badget);
        resolve(socket.badget);
    });
}

WebPigeon.prototype.broadcast = function(message) {
    var self = this;
    self.socket.emit(WebPigeon.EVENT.BROADCAST, message);
}

WebPigeon.prototype.targetcast = function(id, message) {
    var self = this;
    var targets = self.get(id);
    if(!targets || !targets.length) return;

    targets.forEach(function(target) {
        if(!target || !target.socket) return;

        target.socket.emit(WebPigeon.EVENT.TARGETCAST, message);
    });
}

WebPigeon.prototype.mail = function(message) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var mail = {};
        mail.to = message.to;
        mail.from = message.from;
        mail.subject = message.subject;

        if(message.mode == "HTML") {
            mail.html = self.options.messagemaker("HTML", message.data, message.template);
        } else {
            mail.text = self.options.messagemaker("TXT", options.data);
        }

        if(self.options.fake) {
            self.options.fake(mail);
            return resolve(mail);
        }

        self.transporter.sendMail(mail, function(error, info) {
            if(error) return reject({error:error});

            resolve(info);
        });
    });
}


// PRIVATE
function initListeners(self) {
    if(!self || !self.socket) return;

    self.socket.on("connection", function(socket) {
        self.connect(socket)
        .then(function(badget) {
            socket.on("disconnect", function() {
                self.disconnect();
            });

            socket.on("targets", function() {
                socket.emit("targets", self.targets());
            });
        })
    });
}