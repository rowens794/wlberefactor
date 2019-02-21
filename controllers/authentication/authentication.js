const jwt = require('jsonwebtoken');
const passport = require('passport');
const Sentry = require('@sentry/node');
const mongoose = require('mongoose');
const md5 = require('md5');

const User = mongoose.model('User');
const mail = require('../email/email');

// get the global rootURL
const { rootURL } = global;

exports.signIn = async (req, res) => {
  passport.authenticate('local', async (authenticationError, user) => {
    // do initial checks on login
    if (authenticationError) {
      return res.json(JSON.stringify({ login: 'failed' }));
    }
    if (!user) return res.json(JSON.stringify({ login: 'failed' }));

    await req.logIn(user, async (loginError) => {
      if (loginError) {
        Sentry.captureMessage(`AUTHENTICATION ERROR: login Error ${loginError} `);
        return res.json(JSON.stringify({ login: 'failed' }));
      }

      const cert = process.env.JWT_KEY;
      //const ExpirationInSections = 60 * 60 * 24 * 2000; // token lasts for 2000 days
      const ExpirationInSections = 10; // token lasts for 2000 days

      let tokenExp = new Date();
      tokenExp.setSeconds(tokenExp.getSeconds() + ExpirationInSections);
      tokenExp = new Date(tokenExp).getTime();

      await jwt.sign({ userID: user.id }, cert, { expiresIn: ExpirationInSections }, async (jwtSignError, token) => {
        if (jwtSignError) {
          Sentry.captureMessage(`AUTHENTICATION ERROR: JWT Sign Error ${jwtSignError} `);
          return res.json(JSON.stringify({ login: 'failed' }));
        }

        const response = {
          token,
          userID: user.id,
          tokenExp,
          accountVerified: user.verified,
        };
        return res.json(response);
      });
      return null;
    });
    return null;
  })(req, res);
};

exports.verifyToken = (req, res) => {
  const decoded = jwt.verify(req.body.token, process.env.JWT_KEY);
  res.send(decoded);
};

exports.getUserData = (req, res) => {
  if (req.body.token === null) {
    res.json({ status: 'tokenExpired' });
  } else {
    const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);

    // capture expired token and force re-login
    if (userTokenID.exp <= userTokenID.iat) {
      res.json({ status: 'tokenExpired' });
    } else {
      User.findById(userTokenID.userID, (err, user) => {
        if (err) res.json({ status: 'failed' });
        res.json(user);
      });
    }
  }
};

exports.getUserCompData = (req, res) => {
  if (req.body.token === null) {
    res.json({ status: 'tokenExpired' });
  } else {
    const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);

    // capture expired token and force re-login
    if (userTokenID.exp <= userTokenID.iat) {
      res.json({ status: 'tokenExpired' });
    } else {
      User.findById(userTokenID.userID, (err, user) => {
        if (err) res.json({ status: 'failed' });
        res.json(user);
      });
    }
  }
};

exports.forgotPassword = (req, res) => {
  // look up user, generate a verification string and save string to db
  User.findOne({ email: req.body.username }, (err, user) => {
    if (err) {
      res.json({ reset: 'failed' });
    } else {
      const ID = user.id;
      const verificationString = md5(Math.random() * 100000000);
      const userDoc = user;
      userDoc.verificationString = verificationString;
      userDoc.save();

      const resetURL = `${rootURL}resetpassword/${ID}/${verificationString}`;
      mail.sendPasswordReset(user.email, resetURL);

      res.json({ reset: 'success' });
    }
  });
};

exports.setPassword = (req, res) => {
  // look up user, generate a verification string and save string to db
  User.findById(req.body.id, (err, user) => {
    if (err) {
      res.json({ reset: 'failed' });
    } else if (user.verificationString === req.body.verificationString) {
      user.setPassword(req.body.password, () => {
        user.save();
        res.json({ reset: 'success' });
      });
    } else {
      res.json({ reset: 'failed' });
    }
  });
};

exports.changeEmailPref = (req, res) => {
  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);

  User.findById(userTokenID.userID, (err, user) => {
    if (err) {
      res.json({ status: 'failed' });
    } else {
      res.json({ status: 'success' });
      const userDoc = user;
      userDoc.emailsEnabled = false;
      userDoc.save();
    }
  });
};
