module.exports = WebPigeon;

var nodemailer = require("nodemailer");
var SkinSpider = require("skinspider");


function WebPigeon (options) {
    var self = this;
    self.options = Object.assign(WebPigeon.DEFAULTOPTIONS, options) || {};
    self.transporter = nodemailer.createTransport(self.options.smtp);
}

WebPigeon.DEFAULTOPTIONS = {
    smtp : {
        service : "MailGun",
        domaine : "sandbox7675be11bc2a485e8ed106a5f916dfe4.mailgun.org",
        api_key : "key-f26b43fc4e32cb9911f5bc63fe312b16",
        auth: {
            user: 'postmaster@sandbox7675be11bc2a485e8ed106a5f916dfe4.mailgun.org',
            pass: 'bcda9d2c8227c18bcdeec6e6a2b90a45'
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