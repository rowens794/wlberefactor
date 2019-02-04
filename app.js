const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressValidator = require('express-validator');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const cors = require('cors');
const Sentry = require('@sentry/node');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

require('dotenv').config(); // handle hidden environment variables

// establish whether the server has started in development or production
let DB_URI = null;
if (process.env.PRODUCTION === 'true') {
  global.rootURL = process.env.FE_PRODUCTION_URL;
  console.log('server started in PRODUCTION');
  console.log(`Frontend Root URL:   ${global.rootURL}`);
  console.log(`Backend Root URL:   ${process.env.SERVER_URL}`);
  DB_URI = `mongodb://${process.env.DB_USERNAME}:${
    process.env.DB_PASSWORD
  }@ds147264-a0.mlab.com:47264,ds147264-a1.mlab.com:47264/wtlscompn?replicaSet=rs-ds147264`;
} else {
  global.rootURL = process.env.FE_DEV_URL;
  console.log('server started in DEVELOPMENT');
  console.log(`Frontend Root URL:   ${global.rootURL}`);
  console.log(`Backend Root URL:   ${process.env.SERVER_URL}`);
  DB_URI = `mongodb://${process.env.DB_REF_USERNAME}:${
    process.env.DB_REF_PASSWORD
  }@ds159993.mlab.com:59993/wtlscomp`;
}

// register app
const app = express();

// initialize Sentry
Sentry.init({
  dsn: 'https://f3bbe69d195646e0892b19a990772106@sentry.io/1385697',
});
app.use(Sentry.Handlers.requestHandler());

// use bodyparser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Connect to Database
mongoose.connect(DB_URI, { useNewUrlParser: true });

// Import models
require('./models/userSchema');
require('./models/competitionSchema');
const User = require('./models/userSchema');

// allow CORS
app.use(cors());

app.use(express.static('public'));

app.use(
  session({
    saveUninitialized: false, // don't create session until something stored
    resave: false, // don't save session if unmodified
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  }),
);

// initialize passport js
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

// exposes validation methods to requests
app.use(expressValidator());

// import router
const indexRouter = require('./routes/index');

app.use('/', indexRouter);

// Sentry Error handler
app.use(Sentry.Handlers.errorHandler());

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
