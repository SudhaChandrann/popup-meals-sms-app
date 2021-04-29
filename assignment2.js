const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const _ = require('underscore');
const multer = require('multer');
const upload = multer();

const port = process.env.PORT || parseInt(process.argv.pop()) || 3002;

server.listen(port, function () {
  console.log("Server listening at port %d", port);
});

const RestaurantOrder = require("./assignment2Restaurant");
const e = require('express');
const { exception } = require('console');
const Order = require('./assignment2Order');

// Create a new express application instance

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("www"));

let oSockets = {};
let oOrders = {};
app.post("/payment/:phone", (req, res) => {
  // this happens when the order is complete
  sFrom = req.params.phone;
  const aReply = oOrders[sFrom].handleInput(req.body);
  const oSocket = oSockets[sFrom];
  // send messages out of turn
  for (let n = 0; n < aReply.length; n++) {
    if (oSocket) {
      const data = {
        message: aReply[n]
      };
      oSocket.emit('receive message', data);
    } else {
      throw new Exception("twilio code would go here");
    }
  }
  if (oOrders[sFrom].isDone()) {
    delete oOrders[sFrom];
    delete oSockets[sFrom];
  }
  res.end("ok");
});

app.get("/payment/:phone", (req, res) => {
  // this happens when the user clicks on the link in SMS
  const sFrom = req.params.phone;
  if (!oOrders.hasOwnProperty(sFrom)) {
    res.end("order already complete");
  } else {
    res.end(oOrders[sFrom].renderForm());
  }
});

app.post("/payment", upload.none(), (req, res) => {
    console.log("FomData" + req.form);
    let sFrom = req.body.phone;
    console.log("Form body " + JSON.stringify(sFrom));
    let sUrl = "http://localhost:3002/payment"
    console.log("URL - " + sUrl)
    oOrders[sFrom] = new RestaurantOrder(sFrom, sUrl);
    oOrders[sFrom].totalprice = 10;
    res.end( oOrders[sFrom].renderForm());
});

app.post("/sms", (req, res) => {
  // turn taking SMS
  let sFrom = req.body.From || req.body.from;
  let sUrl = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers['x-forwarded-host'] || req.headers.host}${req.baseUrl}`;
  if (!oOrders.hasOwnProperty(sFrom)) {
    oOrders[sFrom] = new RestaurantOrder(sFrom, sUrl);
  }
  if (oOrders[sFrom].isDone()) {
    delete oOrders[sFrom];
  }
  let sMessage = req.body.Body || req.body.body;
  let aReply = oOrders[sFrom].handleInput(sMessage);
  res.setHeader('content-type', 'text/xml');
  let sResponse = "<Response>";
  for (let n = 0; n < aReply.length; n++) {
    sResponse += "<Message>";
    sResponse += aReply[n];
    sResponse += "</Message>";
  }
  res.end(sResponse + "</Response>");
});

io.on('connection', function (socket) {
  // when the client emits 'receive message', this listens and executes
  socket.on('receive message', function (data) {
    // set up a socket to send messages to out of turn
    const sFrom = _.escape(data.from);
    oSockets[sFrom] = socket;
  });
});