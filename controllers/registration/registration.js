const mongoose = require('mongoose');
const md5 = require('md5');
const Sentry = require('@sentry/node');
const jwt = require('jsonwebtoken');

const User = mongoose.model('User');
const Competition = mongoose.model('Competition');
const mail = require('../email/email');

const { rootURL } = global;
const authenticate = User.authenticate();

function userValidation(request) {
  request.sanitizeBody('name');
  request.checkBody('name', 'You must supply a name').notEmpty();
  request.checkBody('email', 'Email is not valid').isEmail();
  return request.validationErrors();
}

exports.userVerification = async (req, res) => {
  const { userID, verificationToken } = req.params;

  User.findById(req.params.userID, (err, user) => {
    if (err) {
      res.redirect(`${rootURL}verified?error_code_1`);
      Sentry.captureMessage(`USER VERIFICATION: Failed to verify User userID: ${userID} | verificationToken: ${verificationToken}`);

      // if users verification code matches the one originally assigned then set user to verified
    } else if (user.verificationString === req.params.verificationToken) {
      // test if user is signed up for a competition and if so take them straight to dashboard
      if (user.competitions.length > 0 && user.verified === true) {
        res.redirect(`${rootURL}dashboard`);
      } else {
        const verifiedUser = user;
        verifiedUser.verified = true;
        user.save();
        mail.sendYouAreSignedUp(user.email, userID, user.name);
        res.redirect(`${rootURL}verified?success`);
      }
    } else {
      // if the users verification code did not match
      res.redirect(`${rootURL}verified?error_code_2`);
      Sentry.captureMessage(`USER VERIFICATION: userID: ${userID} has attempted to verify with in incorrect verificationToken: ${verificationToken}`);
    }
  });
};

exports.userRegistrationFromInvite = (req, res) => {
  // test for validation errors
  const errors = userValidation(req);
  if (errors) {
    // let frontend know if there is an input error
    res.json({ message: errors[0].msg });
  } else {
    // create a new user account
    User.register(
      {
        username: req.body.email,
        email: req.body.email,
        name: req.body.name,
        verified: false,
        verificationString: md5(Math.random() * 100000000),
        emailsEnabled: true,
        signUpDate: new Date(),
      },
      req.body.password,
      (userRegistrationError, user) => {
        if (userRegistrationError) {
          res.json({
            message: 'A user with the given email address is already registered',
          });
          Sentry.captureMessage(`USER REGISTRATION: Unable to register user from invite with email: ${req.body.email} - ${userRegistrationError}`);
        } else {
          // authenticate the user
          authenticate('username', 'password', (authenticationError) => {
            if (authenticationError) {
              res.json({
                message: 'Unable to authenticate user.',
              });
              Sentry.captureMessage('USER REGISTRATION: Error authenticating user');
            } else {
              /* Once the user has been registered and authenticated
              then add the user to the competition */
              Competition.findById(req.body.comp_id, (competitionRetrievalError, competition) => {
                if (competitionRetrievalError) {
                  Sentry.captureMessage(`USER REGISTRATION: Cannot add user ${req.body.email} to competititon: ${req.body.comp_id}`);
                  res.json({
                    message: 'We had trouble locating the requested competition.',
                  });
                } else {
                  competition.Players.push([user.name, user.email, competition.DateObj]);
                  competition.markModified('Players');
                  competition.save();

                  // Add the competition to the user
                  user.competitions.push({
                    id: competition.id,
                    name: competition.CompetitionName,
                    admin: false,
                  });
                  user.markModified('competitions');
                  user.save();

                  // send a welcome email with verification string to new user
                  mail.sendWelcomeEmail(user.email, user.id, user.name, user.verificationString);

                  // send success message
                  res.json({ message: 'success' });
                }
              });
            }
          });
        }
      },
    );
  }
};

exports.userRegistration = (req, res) => {
  // test for validation errors
  const validationErrors = userValidation(req);
  if (validationErrors) {
    // let frontend know if there is an input error
    res.json({ message: validationErrors[0].msg });
  } else {
    // register the user
    User.register(
      {
        username: req.body.email,
        email: req.body.email,
        name: req.body.name,
        verified: false,
        verificationString: md5(Math.random() * 100000000),
        emailsEnabled: true,
        signUpDate: new Date(),
        lastSignIn: new Date(),
      },
      req.body.password,
      (userRegistrationError, user) => {
        if (userRegistrationError) {
          res.json({
            message: 'A user with the given email address is already registered',
          });
          Sentry.captureMessage(`USER REGISTRATION: Unable to register user with email: ${req.body.email} - ${userRegistrationError}`);
        } else {
          // authenticate the user
          authenticate('username', 'password', (authenticationError) => {
            if (authenticationError) {
              Sentry.captureMessage('USER REGISTRATION: Error authenticating user');
            } else {
              // send a welcome email with verification string to new user
              mail.sendWelcomeEmail(user.email, user.id, user.name, user.verificationString);
              // once authenticated send user to registration recieved page
              res.json({ message: 'success' });
            }
          });
        }
      },
    );
  }
};

exports.resendVerificationEmail = (req, res) => {
  if (req.body.token === null) {
    res.json({ status: 'tokenExpired' });
  } else {
    const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);

    User.findById(userTokenID.userID, (err, user) => {
      if (err) res.json({ status: 'failed' });
      mail.sendWelcomeEmail(user.email, user.id, user.name, user.verificationString);
      res.json({ message: 'success' });
    });
  }
};
