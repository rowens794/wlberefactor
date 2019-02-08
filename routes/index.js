// node module imports
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const normalizeEmail = require('normalize-email');
const md5 = require('md5');

const router = express.Router(); // routing

// my code imports
const registration = require('../controllers/registration/registration');
const userController = require('../controllers/userController');
const competitionController = require('../controllers/competitionController');
const mail = require('../controllers/mailController');
const cron = require('../controllers/cronController');
const authentication = require('../controllers/authentication/authentication');

const User = mongoose.model('User');
const Competition = mongoose.model('Competition');

// get the global rootURL
const { rootURL } = global;

/* ----------------- Routes ------------------ */
router.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

/* ----------------- test ------------------ */
router.get('/test', (req, res) => {
  res.send('success');
});

// -------REGISTRATION RELATED ROUTES-------------
// create user account
router.post('/registration', (req, res) => {
  registration.userRegistration(req, res);
});

// register from competition invite
router.post('/registerfrominvite/:compID', (req, res) => {
  // create the competition and respond back to front end
  registration.userRegistrationFromInvite(req, res);
});

// verify user account
router.get('/userVerification/:userID/:verificationToken', (req, res) => {
  registration.userVerification(req, res);
});
// ----------------------------------------------

// -------AUTHENTICATION RELATED ROUTES-------------
router.post('/signin', (req, res) => {
  authentication.signIn(req, res);
});

router.post('/verifyToken', (req, res) => {
  // this route may not be in use
  authentication.verifyToken(req, res);
});

router.post('/userData', (req, res) => {
  // userData takes in a jwt and returns the users data
  authentication.getUserData(req, res);
});

router.post('/userCompData', (req, res) => {
  // userCompData takes in a jwt and returns the users data returns the same things as getUserData
  authentication.getUserCompData(req, res);
});

router.post('/forgotpassword', (req, res) => {
  // reset user password
  authentication.forgotPassword(req, res);
});

router.post('/setpassword', (req, res) => {
  authentication.setPassword(req, res);
});

router.post('/changeemailpref', (req, res) => {
  authentication.changeEmailPref(req, res);
});

// ----------------------------------------------

router.post('/compData', function(req, res, next) {
  //retrieves competition data based on comp ID
  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
  User.findById(userTokenID.userID, function(err, user) {
    if (err) res.json({ status: 'failed' });
    Competition.findById(req.body.competitionId, function(err, competition) {
      res.json(competition);
    });
  });
});

router.post('/limitedCompData', function(req, res, next) {
  //retrieves competition data based on comp ID
  Competition.findById(req.body.competitionId, function(err, competition) {
    if (err) {
      console.log(err);
    } else {
      res.json(competition);
    }
  });
});

router.post('/updateCompData', function(req, res, next) {
  //retrieves competition data based on comp ID
  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);

  //verify user by token
  User.findById(userTokenID.userID, function(err, user) {
    if (err) res.json({ status: 'failed' });
    var email = normalizeEmail(user.username); // normalize the email so that formatting differences are ignored

    //if user is legit then find competition by ID
    Competition.findById(req.body.competitionId, function(err, competition) {
      if (err) {
        console.log('error finding competition----------------');
      }

      for (let i = 0; i < competition.Players.length; i++) {
        //find the user in the competition by email
        var competitionEmail = normalizeEmail(competition.Players[i][1]); // normalize the email so that formatting differences are ignored

        if (email == competitionEmail) {
          // we have to do some data wrangling with the users information
          let updateDate = Object.keys(req.body.updateFields)[0];
          let newWeight = req.body.updateFields[updateDate];
          competition.Players[i][2][updateDate] = newWeight;
          //once the users data is updated then mark the document as modified and resave to DB
          competition.markModified('Players');
          competition.save(function(err, competition) {
            if (err) {
              //not currently handling this error as it won't affect DB or userexperience on front end
              console.log(err);
            } else {
              console.log('competition updated successfully');
            }
          });
        }
      }
      //send a json of the updated competition back to front end to update users screen
      res.json(competition);
    });
  });
});

router.post('/createCompetition', function(req, res, next) {
  //create the competition and respond back to front end
  competitionController.createCompetitionRefac(req, res);
});

router.post('/addUserToComp', function(req, res, next) {
  //create the competition and respond back to front end
  competitionController.addUserRefac(req, res);
});

router.post('/addUserToCompFromEmail', function(req, res, next) {
  //create the competition and respond back to front end
  competitionController.addUserToCompFromEmail(req, res);
});

router.get('/cronpost', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  cron.sendReviewEmails(req, res);
});

router.get('/cronremind', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  cron.sendRemindEmails(req, res);
});

router.post('/addCompByID', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  competitionController.addCompetitionByID(req, res);
});

module.exports = router;
