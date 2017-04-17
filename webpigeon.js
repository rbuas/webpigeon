module.exports = WebPigeon;

var nodemailer = require("nodemailer");
var SkinSpider = require("skinspider");


function WebPigeon (options) {
    var self = this;
    self.options = Object.assign(WebPigeon.DEFAULTOPTIONS, options) || {};
    self.transporter = nodemailer.createTransport(self.options.smtp);
    self.skinspider = self.options.skinspider || new SkinSpider(self.options.skinspiderconfig);
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
    fake : null
}

WebPigeon.ERROR = {};

WebPigeon.prototype.send = function(options) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var mail = {};
        mail.to = options.to;
        mail.from = options.from;
        mail.subject = options.subject;

        if(options.mode == "HTML") {
            mail.html = SkinSpider.render(options.template, options.data);
        } else {
            mail.text = options.data;
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