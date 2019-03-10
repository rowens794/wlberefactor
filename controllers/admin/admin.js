const mongoose = require('mongoose');
const moment = require('moment');

const User = mongoose.model('User');
const Competition = mongoose.model('Competition');
const ClickTracking = mongoose.model('ClickTracking');

function compAnalysis(allComps) {
  var compList = [];
  allComps.forEach((competition) => {
    compList.push({
      name: competition.CompetitionName,
      players: competition.Players,
      invites: competition.Invites,
      id: competition.id,
      creationDate: moment(new Date(competition.CompetitionCreationDate)).format('M/D/YY'),
      startDate: moment(new Date(competition.StartDate)).format('M/D/YY'),
      length: competition.CompetitionLength,
      lastActivity: moment(new Date(competition.LastCompetitionActivity)).format('M/D/YY'),
      numberOfParticipants: competition.Players.length,
      payout: competition.Payout,
      entryFee: competition.EntryFee,
      interimPrize: competition.InterimPrize,
    });
  });
  allComps.sort((a, b) => {
    return new Date(b.lastActivity) - new Date(a.lastActivity);
  });

  return compList;
}

function userAnalysis(allUsers) {
  var userList = [];

  allUsers.forEach((user) => {
    let signUpDate = null;
    if (user.signUpDate) {
      signUpDate = user.signUpDate;
      signUpDate = moment(user.signUpDate).format('M/D/YY');
    }
    let lastSignIn = null;
    if (user.lastSignIn) {
      lastSignIn = moment(user.lastSignIn).format('M/D/YY');
    }

    userList.push({
      name: user.name,
      email: user.email,
      id: user.id,
      signUpDate,
      lastSignIn,
      numberOfCompetitions: user.competitions.length,
      verified: user.verified,
      emailsEnabled: user.emailsEnabled,
    });

    userList.sort((a, b) => {
      return new Date(b.lastSignIn) - new Date(a.lastSignIn);
    });
  });
  return userList;
}

function clickAnalysis(allClicks) {
  var clickList = [];

  allClicks.forEach((click) => {
    clickList.push({
      emailName: click.EmailName,
      user: click.Email,
      emailTarget: click.LinkSource,
      date: moment(new Date(click.ClickDate)).format('M/D/YY'),
    });
  });

  allClicks.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  return clickList;
}

exports.admin = async (req, res) => {
  const key = req.body.key;

  if (key === process.env.ADMIN_KEY) {
    // collect database data
    var allUsers = null;
    var allComps = null;
    var allClicks = null;

    await User.find({}, (err, users) => {
      allUsers = userAnalysis(users);
    });

    await Competition.find({}, (err, competitions) => {
      allComps = compAnalysis(competitions);
    });

    await ClickTracking.find({}, (err, clicks) => {
      allClicks = clickAnalysis(clicks);
    });

    res.json({
      ident: process.env.ADMIN_KEY,
      users: allUsers,
      comps: allComps,
      clicks: allClicks,
    });
  } else {
    res.json({ login: 'failed' });
  }
};
