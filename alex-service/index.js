var express = require("express");
var alex = require("alex");

var app = express();

app.get("/", function(req, res) {
  if (req.query.message) {
    res.send(alex(req.query.message).messages);
  } else {
    res.send("no message provided");
  }
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
