var express = require("express");
var alex = require("alex");
var utils = require("./utils");
var app = express();

app.get("/", function(req, res) {
  var message = req.query.message;
  if (message) {
    messageValidated = utils.validate(message);
    res.send(alex(messageValidated).messages);
  } else {
    res.send("I couldn't find any message to evaluate.");
  }
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
