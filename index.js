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

var preliminaryFeedback
var finalFeedback

app.post("/preliminaryfeedback", function(req, res) {
  preliminaryFeedback = req.query.message || "Something went wrong."
  res.send(preliminaryFeedback)
})

app.post("/finalfeedback", function(req, res) {
  finalfeedback = req.query.message || "Something went wrong."
  res.send(finalfeedback)
})


alexaApp.launch(function(request, response) {
  response.say("You launched the app!");
});

alexaApp.dictionary = {
  names: ["matt", "joe", "bob", "bill", "mary", "jane", "dawn"]
};

alexaApp.intent(
  "me",
  {
    slots: { TWEET: "LITERAL" },
    utterances: ["me the following {tweet|TWEET}"]
  },
  function(request, response) {
    console.log("Intent received");
    var tweet = request.slot("TWEET");
    sendMail(tweet, response);
    response.say("Success! I retrieved your tweet " + tweet);
  }
);

var slots = {};
var utterances = [];
for (i = 1; i < 16; i++) {
  var chr = String.fromCharCode(97 + i).toUpperCase();
  let tweetKey = `TWEET${chr}`
  slots[tweetKey] = "LITERAL"

  let messagePrefix = "following message";
  let tweetKeyLower = tweetKey.toLowerCase()
  if (i === 1) {
    utterances.push(`${messagePrefix} \{${tweetKeyLower}|${tweetKey}\}`);
  } else {
    let prior = utterances[i - 2];
    utterances.push(`${prior}  \{${tweetKeyLower}|${tweetKey}\}`);
  }
}

alexaApp.intent(
  "post",
  {
    slots: slots,
    utterances: utterances
  },
  function(request, response) {
    console.log("Intent received");

    var tweet = request.slot("TWEETa");
    sendMail(tweet, response);
    setTimeout( () => {
      if(preliminaryFeedback) {
        response.say(preliminaryFeedback);
        preliminaryFeedback = undefined
      }
      if (finalFeedback) {
        response.say(finalFeedback);
        finalFeedback = undefined
      }
    }, 2000)
  }
);

alexaApp.intent(
  "to",
  {
    slots: { TWEET: "LITERAL" },
    utterances: ["tweet {tweet|TWEET}"]
  },
  function(request, response) {
    console.log("Intent received");

    var tweet = request.slot("TWEET");
    console.log("received the following text: " + tweet);
    sendMail(tweet, response);
    // response.say("Success! I retrieved your tweet " + tweet);
  }
);

function sendMail(tweet, response) {
  var nodemailer = require("nodemailer");

  var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  transporter.sendMail(
    {
      from: process.env.MAIL_USER,
      to: process.env.WF_MAIL,
      subject: "incoming tweet",
      text: tweet
    },
    function(error, info) {
      if (error) {
        console.log(error);
        response.say("Error while sending mail.");
      }
      if (info) {
        response.say("Workflow triggered");
        console.log("Message sent: " + info.response);
      }
    }
  );
}

app.listen(PORT, () => console.log("Listening on port " + PORT + "."));
