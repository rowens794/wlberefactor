const sgMail = require('@sendgrid/mail');
const Email = require('email-templates');
const htmlToText = require('html-to-text');
const Sentry = require('@sentry/node');
const moment = require('moment');

let { rootURL, serverURL } = global;
// rootURL = 'http://localhost:3000/';
// serverURL = 'http://localhost:3001/';

exports.sendYouAreSignedUp = async (email, userID, name) => {
  const emailObj = new Email();
  const linkURL = `${serverURL}beachbodyod?id=${userID}`;
  const msg = await emailObj.render('youAreIn', {
    email,
    userID,
    name,
    rootURL,
    serverURL,
    linkURL,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: email,
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: 'You are All Setup + Tips for Shedding Pounds',
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendYouAreSignedUp to ${email}`);
    }
  });
};

exports.sendWelcomeEmail = async (email, userID, name, verificationString) => {
  const emailObj = new Email();
  const msg = await emailObj.render('welcomeEmail', {
    email,
    userID,
    name,
    verificationString,
    rootURL,
    serverURL,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: email,
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: 'Welcome To Flipping the Scales',
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendWelcomeEmail to ${email}`);
    }
  });
};

exports.sendJoinCompEmail = async (email, name, invitor, competitionID) => {
  const emailObj = new Email();
  const msg = await emailObj.render('joinCompetition', {
    name,
    invitor,
    competitionID,
    rootURL,
    serverURL,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: email,
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: "You've been Invited to a Weightloss Competition",
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendJoinCompEmail to ${email}`);
    }
  });
};

exports.sendYouveBeenAddedEmail = async (email, name, invitor, competitionName) => {
  const emailObj = new Email();
  const msg = await emailObj.render('youveBeenAdded', {
    name,
    invitor,
    competitionName,
    rootURL,
    serverURL,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: email,
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: "You've been Added to a Weightloss Competition",
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendYouveBeenAddedEmail to ${email}`);
    }
  });
};

exports.sendPasswordReset = async (email, link) => {
  const emailObj = new Email();
  const msg = await emailObj.render('passwordReset', {
    link,
    rootURL,
    serverURL,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: email,
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: 'PASSWORD RESET: Flipping The Scales',
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendPasswordReset to ${email}`);
    }
  });
};

exports.sendReminderEmail = async (name, email, competitionName) => {
  const emailObj = new Email();
  const msg = await emailObj.render('reminderEmail', {
    name,
    competitionName,
    rootURL,
    serverURL,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: email,
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: `Weigh-in Today - ${competitionName}`,
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendReminderEmail to ${email}`);
    }
  });
};

exports.sendWeeklyReminder = async (focusUser, sortedUsers, competitionInfo, competitionName) => {
  const emailObj = new Email();

  const msg = await emailObj.render('weeklyUpdate', {
    focusUser,
    sortedUsers,
    competitionInfo,
    competitionName,
    rootURL,
    serverURL,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: focusUser[1],
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: `Weekly Update for ${competitionName}`,
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendWeeklyReminder to ${focusUser.email}`);
    }
  });
};

exports.sendInterimAnnouncement = async (focusUser, sortedUsers, competitionInfo, competitionName, lookback) => {
  // determine if focusUser missed weighin
  let focusUserMissedWeighIn = false;
  if (focusUser[lookback] === 'N/A') {
    focusUserMissedWeighIn = true;
  }

  // determine if focusUser is winning
  let focusUserIsLeader = false;
  if (focusUser.email === sortedUsers[0].email) {
    focusUserIsLeader = true;
  }

  // set the lookup string
  let lookupString = 'twoWeekLoss';
  let lookbackString = '2 weeks';
  if (competitionInfo.interPrizeOffset === 28) {
    lookupString = 'fourWeekLoss';
    lookbackString = '4 weeks';
  }

  const participantPeriodLosses = [];
  sortedUsers.forEach((user) => {
    participantPeriodLosses.push({
      name: user.name,
      periodLoss: user[lookupString],
      totalLoss: user.totalLoss,
      rootURL,
      serverURL,
    });
  });

  const emailObj = new Email();

  const msg = await emailObj.render('interimUpdate', {
    focusUser,
    sortedUsers,
    participantPeriodLosses,
    competitionInfo,
    competitionName,
    focusUserMissedWeighIn,
    focusUserIsLeader,
    lookbackString,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: focusUser[1],
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: `Interim Prize Awarded for ${competitionName}`,
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendInterimAnnouncement to ${focusUser.email}`);
    }
  });
};

exports.sendWinnerAnnouncement = async (focusUser, sortedUsers, competitionInfo, competitionName, lookback) => {
  // set object for top 3 placements
  const winnersObj = {
    first: {
      exists: true,
      name: sortedUsers[0].name,
      totalLoss: sortedUsers[0].totalLoss,
      prize: competitionInfo.grandPrizes[0],
    },
  };

  winnersObj.second = {};
  winnersObj.third = {};

  if (competitionInfo.grandPrizes.length > 1) {
    winnersObj.second.exists = true;
    winnersObj.second.name = sortedUsers[1].name;
    winnersObj.second.totalLoss = sortedUsers[1].totalLoss;
    winnersObj.second.prize = competitionInfo.grandPrizes[1];
  } else {
    winnersObj.second.exists = false;
    winnersObj.second.name = null;
    winnersObj.second.totalLoss = null;
    winnersObj.second.prize = null;
  }

  if (competitionInfo.grandPrizes.length > 2) {
    winnersObj.third.exists = true;
    winnersObj.third.name = sortedUsers[2].name;
    winnersObj.third.totalLoss = sortedUsers[2].totalLoss;
    winnersObj.third.prize = competitionInfo.grandPrizes[2];
  } else {
    winnersObj.third.exists = false;
    winnersObj.third.name = null;
    winnersObj.third.totalLoss = null;
    winnersObj.third.prize = null;
  }

  // determine if focusUser is winning
  let focusUserIsLeader = false;
  if (focusUser[1] === sortedUsers[0].email) {
    focusUserIsLeader = true;
  }

  // set the lookup string
  let lookupString = 'twoWeekLoss';
  let lookbackString = '2 weeks';
  if (competitionInfo.interPrizeOffset === 28) {
    lookupString = 'fourWeekLoss';
    lookbackString = '4 weeks';
  }

  const participantPeriodLosses = [];
  sortedUsers.forEach((user) => {
    participantPeriodLosses.push({
      name: user.name,
      periodLoss: user[lookupString],
      totalLoss: user.totalLoss,
    });
  });

  // set ranking in sorted users object
  const sortedUsersCopy = sortedUsers;
  for (let j = 0; j < sortedUsers.length; j += 1) {
    sortedUsersCopy[j].rank = j + 1;
  }

  const emailObj = new Email();

  const msg = await emailObj.render('winnerAnnouncement', {
    focusUser,
    focusUserIsLeader,
    sortedUsersCopy,
    lookbackString,
    competitionInfo,
    competitionName,
    lookback,
    periodEnd: moment(new Date()).format('M/D/YY'),
    winnersObj,
    rootURL,
    serverURL,
  });

  const text = htmlToText.fromString(msg, {
    wordwrap: 130,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const emailMsg = {
    to: focusUser[1],
    bcc: 'emails@flippingthescales.com',
    from: 'Ryan@flippingthescales.com',
    subject: `A Winner is Crowned for ${competitionName}`,
    text,
    html: msg,
  };

  sgMail.send(emailMsg, (error) => {
    if (error) {
      Sentry.captureMessage(`EMAIL SEND ERROR: Unsuccessful send of sendInterimAnnouncement to ${focusUser.email}`);
    }
  });
};
