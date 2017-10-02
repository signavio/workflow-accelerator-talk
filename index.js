var express = require("express");
var alexa = require("alexa-app");

var PORT = process.env.PORT || 8080;
var app = express();

// ALWAYS setup the alexa app and attach it to express before anything else.
var alexaApp = new alexa.app("test");

alexaApp.express({
    expressApp: app,
    //router: express.Router(),

    // verifies requests come from amazon alexa. Must be enabled for production.
    // You can disable this if you're running a dev environment and want to POST
    // things to test behavior. enabled by default.
    checkCert: false,

    // sets up a GET route when set to true. This is handy for testing in
    // development, but not recommended for production. disabled by default
    debug: true
});

// now POST calls to /test in express will be handled by the app.request() function

// from here on you can setup any other express routes or middlewares as normal
app.set("view engine", "ejs");

alexaApp.launch(function (request, response) {
    response.say("You launched the app!");
});

alexaApp.dictionary = {"names": ["matt", "joe", "bob", "bill", "mary", "jane", "dawn"]};

alexaApp.intent("me", {
        "slots": {"TWEET": "LITERAL"},
        "utterances": [
            "me the following {tweet|TWEET}"
        ]
    },
    function (request, response) {
        console.log('Intent received')
        var tweet = request.slot("TWEET");
        sendMail(tweet, response);
        response.say("Success! I retrieved your tweet " + tweet);
    }
);

function sendMail(tweet, response) {
    var nodemailer = require('nodemailer');
    console.log(process.env.MAIL_USER);

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.MAIL_USER, // Your email id
            pass: process.env.MAIL_PASS // Your password
        }
    });

    var mailOptions = {
        from: 'demo@signavio.com>', // sender address
        to: process.env.WF_MAIL, // list of receivers
        subject: 'Email Example', // Subject line
        text: tweet //, // plaintext body
        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            response.say("Error while sending mail.")
        } else {
            response.say("Workflow triggered")
            console.log('Message sent: ' + info.response);
        }
        ;
    });
}

app.listen(PORT, () => console.log("Listening on port " + PORT + "."));
