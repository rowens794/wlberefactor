// node module imports
const express = require('express');

const router = express.Router(); // routing

// my code imports
const registration = require('../controllers/registration/registration');
const cron = require('../controllers/cronController');
const authentication = require('../controllers/authentication/authentication');
const competition = require('../controllers/competition/competition');

// for testing
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Competition = mongoose.model('Competition');

/* ----------------- Test if Server is Live ------------------ */
router.get('/', (req, res) => {
  res.send('success');
});

/* ----------------- test ------------------ */
router.get('/test', async (req, res) => {
  var newUser = null;
  await User.find({ email: 'rowens7ff94@gmail.com' }, (userRetrievalError, user) => {
    if (userRetrievalError) {
      res.json({ status: 'failed' });
      console.log('error');
    } else if (user.length === 0) {
      console.log(user);
      console.log("user doens't exist");
    } else {
      console.log('success');
      console.log(user);
      newUser = user;
    }
  });
  res.send(newUser);
});

// -------REGISTRATION RELATED ROUTES-------------

router.post('/registration', (req, res) => {
  registration.userRegistration(req, res);
});

router.post('/registerfrominvite/:compID', (req, res) => {
  registration.userRegistrationFromInvite(req, res);
});

router.get('/userVerification/:userID/:verificationToken', (req, res) => {
  registration.userVerification(req, res);
});

// -------AUTHENTICATION RELATED ROUTES-------------
router.post('/signin', (req, res) => {
  authentication.signIn(req, res);
});

router.post('/verifyToken', (req, res) => {
  authentication.verifyToken(req, res); // this route may not be in use
});

router.post('/userData', (req, res) => {
  authentication.getUserData(req, res);
});

router.post('/userCompData', (req, res) => {
  authentication.getUserCompData(req, res); // returns the users data returns the same things as getUserData
});

router.post('/forgotpassword', (req, res) => {
  authentication.forgotPassword(req, res);
});

router.post('/setpassword', (req, res) => {
  authentication.setPassword(req, res);
});

router.post('/changeemailpref', (req, res) => {
  authentication.changeEmailPref(req, res);
});

// -------COMPETITION RELATED ROUTES-------------

router.post('/compData', (req, res) => {
  competition.getCompData(req, res);
});

router.post('/limitedCompData', (req, res) => {
  competition.getLimitedCompData(req, res); // seems to return the same thing as compData
});

router.post('/updateCompData', (req, res) => {
  competition.updateComp(req, res);
});

router.post('/createCompetition', (req, res) => {
  competition.createCompetition(req, res);
});

router.post('/addUserToComp', (req, res) => {
  competition.addUserToCompetition(req, res);
});

router.post('/addUserToCompFromEmail', (req, res) => {
  competition.addUserToCompFromEmail(req, res);
});

router.post('/addCompByID', (req, res) => {
  competition.addCompetitionByID(req, res);
});

// -------CRON RELATED ROUTES-------------

router.get('/cronpost', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  cron.sendReviewEmails(req, res);
});

router.get('/cronremind', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  cron.sendRemindEmails(req, res);
});

module.exports = router;
