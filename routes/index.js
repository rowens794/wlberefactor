// node module imports
const express = require('express');
const passport = require('passport');
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
const email = require('../controllers/email/email');
const importData = require('../controllers/email/sampleData');

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
  const { sampleData } = importData;
  email.sendWinnerAnnouncement(
    sampleData.focusUser,
    sampleData.sortedUser,
    sampleData.competitionInfo,
    sampleData.competitionName,
    sampleData.lookback,
  );
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

router.post('/signin', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.json(JSON.stringify({ login: 'failed' }));
    }

    //check if user is verified
    console.log(user.verified);
    if (user.verified == 'false' || user.verified == false) {
      return res.json(JSON.stringify({ login: 'notVerified' }));
    } else {
      req.logIn(user, function(err) {
        if (err) return console.log(err);
        var cert = process.env.JWT_KEY;

        const ExpirationInSections = 60 * 60 * 24 * 7; //token lasts for 7 days
        let tokenExp = new Date();
        tokenExp.setSeconds(tokenExp.getSeconds() + ExpirationInSections);
        tokenExp = new Date(tokenExp).getTime();

        jwt.sign({ userID: user._id }, cert, { expiresIn: ExpirationInSections }, function(err, token) {
          if (err) return res.send(err);
          let response = {
            token: token,
            userID: user._id,
            tokenExp: tokenExp,
          };
          return res.json(response);
        });
      });
    }
  })(req, res, next);
});

router.post('/verifyToken', function(req, res, next) {
  // /verifyToken takes in a jwt and returns valid user
  const decoded = jwt.verify(req.body.token, process.env.JWT_KEY);
  res.send(decoded);
});

router.post('/userData', function(req, res, next) {
  //userData takes in a jwt and returns the users data

  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
  User.findById(userTokenID.userID, function(err, user) {
    if (err) res.json({ status: 'failed' });
    res.json(user);
  });
});

router.post('/userCompData', function(req, res, next) {
  //userCompData takes in a jwt and returns the users data
  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
  User.findById(userTokenID.userID, function(err, user) {
    if (err) res.json({ status: 'failed' });
    res.json(user);
  });
});

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

router.post('/forgotpassword', function(req, res, next) {
  //reset user password

  //look up user, generate a verification string and save string to db
  User.findOne({ email: req.body.username }, function(err, user) {
    if (err) {
      console.log('---------error hit resetting password--------------');
      console.log(err);
      res.json({ reset: 'failed' });
    } else {
      console.log('--------resetting password-------------');
      let ID = user.id;
      let verificationString = md5(Math.random() * 100000000);
      user.verificationString = verificationString;
      user.save();

      var resetURL = rootURL + 'resetpassword/' + ID + '/' + verificationString;
      mail.resetPasswordEmail(user.email, resetURL);

      res.json({ reset: 'success' });
    }
  });
});

router.post('/setpassword', function(req, res, next) {
  //reset user password
  console.log(req.body);

  //look up user, generate a verification string and save string to db
  User.findById(req.body.id, function(err, user) {
    if (err) {
      console.log('-------error finding user to reset password--------');
      res.json({ reset: 'failed' });
    } else {
      if (user.verificationString === req.body.verificationString) {
        user.setPassword(req.body.password, function() {
          user.save();
          res.json({ reset: 'success' });
        });
      } else {
        console.log('-------verificaiton string does not match DB--------');
        res.json({ reset: 'failed' });
      }
    }
  });
});

router.get('/cronpost', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  cron.sendReviewEmails(req, res);
});

router.get('/cronremind', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  cron.sendRemindEmails(req, res);
});

router.get('/changeemailpref', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  userController.changeEmailPref(req, res);
});

router.post('/addCompByID', function(req, res) {
  //cron post will provide updates to competitors the day after each weeks completion
  competitionController.addCompetitionByID(req, res);
});

module.exports = router;
