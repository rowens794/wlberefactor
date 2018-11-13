//node module imports
var express = require('express');
var router = express.Router(); //routing
const mongoose = require('mongoose');
require('dotenv').config() //handle hidden environment variables

//my code imports
var userRegistration = require('../controllers/userRegistration');

//establish whether the server has started in development or production (this is set by environment vars)
if (eval(process.env.PRODUCTION)){
  rootURL = process.env.FE_PRODUCTION_URL;
  console.log('server started in PRODUCTION');
  console.log(rootURL);
} else{
  rootURL = process.env.FE_DEV_URL;
  console.log('server started in DEVELOPMENT');
  console.log('Frontend Root URL: '+rootURL);
}

//Connect to Database
let DB_URI = `'mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@ds159993.mlab.com:59993/wtlscomp`;
mongoose.connect(DB_URI, { useNewUrlParser: true });



/* ----------------- Routes ------------------ */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/registration', function(req, res, next) {
  userRegistration.userRegistration(req, res);
});

module.exports = router;
