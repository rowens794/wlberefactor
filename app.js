var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressValidator = require('express-validator');
const mongoose = require('mongoose');
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require('cors');
const helmet = require('helmet')



require('dotenv').config() //handle hidden environment variables

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

//register app
var app = express();

//initiate helmet
app.use(helmet())

//use bodyparser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());


//Connect to Database
let DB_URI = `'mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@ds147264-a0.mlab.com:47264,ds147264-a1.mlab.com:47264/wtlscompn?replicaSet=rs-ds147264`;
mongoose.connect(DB_URI, { useNewUrlParser: true });

//Import models
require('./models/userSchema');
require('./models/competitionSchema');
const User = require('./models/userSchema');
const Competition = require('./models/competitionSchema');

//allow CORS
app.use(cors());

app.use(express.static("public"));
app.use(session({ secret: 'simpleExpressMVC', resave: true, saveUninitialized: true  }));

//initialize passport js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//exposes validation methods to requests
app.use(expressValidator());

//import routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
