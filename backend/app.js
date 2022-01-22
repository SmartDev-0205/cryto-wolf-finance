var express = require('express');
var app = express();
const http = require('http').createServer(app);
const cors = require('cors');
const cron = require('node-cron');
const { scan_event } = require('./functions/scan_events');

app.use(cors());
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  return next();
});


//Main Routing
var Route_wolf = require('./route/wolf');
var Route_wolfpack = require('./route/wolfpack');
var Route_material = require('./route/material');

app.use('/wolf', Route_wolf);
app.use('/wolfpack', Route_wolfpack);
app.use('/material', Route_material);

http.listen(8000, "0.0.0.0", () => {
  console.log(`Server running at https://localhost:8000/`);
});

cron.schedule('* * * * *', async function () {
  console.log("Mongdb Scan Task is running every minute " + new Date());
  await scan_event();
});
