const jwt = require('jsonwebtoken');
const passport = require('passport');
const Sentry = require('@sentry/node');

exports.signIn = async (req, res) => {
  passport.authenticate('local', (authenticationError, user) => {
    // do initial checks on login
    if (authenticationError) return res.json(JSON.stringify({ login: 'failed' }));
    if (!user) return res.json(JSON.stringify({ login: 'failed' }));
    if (user.verified === 'false' || user.verified === false) return res.json(JSON.stringify({ login: 'notVerified' }));

    req.logIn(user, (loginError) => {
      if (loginError) {
        Sentry.captureMessage(`AUTHENTICATION ERROR: login Error ${loginError} `);
        return res.json(JSON.stringify({ login: 'failed' }));
      }

      const cert = process.env.JWT_KEY;
      const ExpirationInSections = 60 * 60 * 24 * 7; // token lasts for 7 days
      let tokenExp = new Date();
      tokenExp.setSeconds(tokenExp.getSeconds() + ExpirationInSections);
      tokenExp = new Date(tokenExp).getTime();

      jwt.sign({ userID: user.id }, cert, { expiresIn: ExpirationInSections }, (jwtSignError, token) => {
        if (jwtSignError) {
          Sentry.captureMessage(`AUTHENTICATION ERROR: JWT Sign Error ${jwtSignError} `);
          return res.json(JSON.stringify({ login: 'failed' }));
        }
        const response = {
          token,
          userID: user.id,
          tokenExp,
        };
        return res.json(response);
      });

      // this return should never be hit
      Sentry.captureMessage(`AUTHENTICATION ERROR: Unexpected return hit ${user}`);
      return res.json(JSON.stringify({ login: 'failed' }));
    });

    // this return should never be hit
    Sentry.captureMessage(`AUTHENTICATION ERROR: Unexpected return hit ${user}`);
    return res.json(JSON.stringify({ login: 'failed' }));
  });
};
