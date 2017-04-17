var _expect = require("chai").expect;
var _assert = require("chai").assert;
var _should = require("chai").should();
var _http = require("http");
var _cheerio = require("cheerio");
var _moment = require("moment");

var JsExt = require("../brain/jsext");
var Log = require("../brain/log");
var Memory = require("../brain/memory");
var WebMailer = require("../brain/webmailer");
var ViewEngine = require("../brain/viewengine");
var Dictionary = require("../brain/dictionary");
var User = require("../models/user");

Dictionary.load(__dirname + "/../common.json");
WebMailer.FAKE = true;

describe("unit.webmailer", function() {
    var wm;

    before(function(done) {
        wm = new WebMailer();
        done();
    });

    after(function(done) {
        done();
    });

    describe("send", function() {
        it("success-text", function(done) {
            wm.send({
                to : "rodrigobuas@gmail.com",
                subject : "test",
                from : "test@rbuas.com",
                mode : "TEXT",
                data : "test test test ;-)"
            }, function(err, info) {
                done();
            });
        });

        it("success-html", function(done) {
            wm.send({
                to : "rodrigobuas@gmail.com",
                subject : "test",
                from : "test@rbuas.com",
                mode : "HTML",
                data : {test:"AAA", test2:"BBB"},
                template : "user_mail_confirm",
            }, function(err, info) {
                done();
            });
        });
    });
});