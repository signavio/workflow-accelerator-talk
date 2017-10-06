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
var feedbackTimer
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
    console.log("Post Intent received");
    response.shouldEndSession(false)
    const intialResponse = response.say('Thanks').send()
    intialResponse.then(() => {
        const values = Object.keys(slots).map(key => request.slot(key));
        const text = values.filter(value => typeof value !== 'undefined' && value !== null).join(' ');
        return sendMail(text, response);
    }).then(()=>{
      return new Promise((resolve, reject) => {
        feedbackTimer = setInterval(() => {
          if (preliminaryFeedback) {
            console.log("preliminary Feedback received");
            response.shouldEndSession(false, 'Are you still there?')
            const feedbackResponse = response.say(preliminaryFeedback).send();
            feedbackResponse.then(() => {resolve('feedback recevied')})
          }
        }, 100);
      });
    }).then(() => {
        preliminaryFeedback = undefined;
        clearInterval(feedbackTimer);
        console.log('Promise resolved');
        response.shouldEndSession(true)
        return response.send()
        // response.say(finalFeedback);
    }).then(() => {
        console.log('finished. send went through')
    });
    /*const feedbackTimer = setInterval( () => {
      if (preliminaryFeedback) {
        console.log("preliminary Feedback received");
        emit(':tell', 'Thank you!');
        preliminaryFeedback = undefined;
        clearInterval(feedbackTimer);
      }
      if (false) {
        response.say(finalFeedback);
        finalFeedback = undefined;
        clearInterval(feedbackTimer);
      }
    }, 1000);*/
    // response.say("Success! I retrieved your tweet " + text);
    return intialResponse
  }
);

alexaApp.intent(
  "to",
  {
    slots: { TWEET: "LITERAL" },
    utterances: ["tweet {tweet|TWEET}"]
  },
  function(request, response) {
    console.log("To Intent received");

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
    }
  );
}

app.listen(PORT, () => console.log("Listening on port " + PORT + "."));
