const mongoose = require('mongoose');
const moment = require('moment');
const client = require('@sendgrid/client');

const User = mongoose.model('User');
const Competition = mongoose.model('Competition');
const ClickTracking = mongoose.model('ClickTracking');
const Admin = mongoose.model('Admin');

client.setApiKey(process.env.SENDGRID_API_KEY);

async function asyncForEach(array, callback) {
  var processedObj = [];
  for (let index = 0; index < array.length; index += 1) {
    let nextComp = await callback(array[index]);
    processedObj.push(nextComp);
  }
  return processedObj;
}

async function createCompetitionObj(competition) {
  const compObj = {
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
  };

  return compObj;
}

async function compAnalysis(allComps) {
  const compList = await asyncForEach(allComps, createCompetitionObj);

  compList.sort((a, b) => {
    if (a.lastActivity === 'Invalid date' && b.lastActivity === 'Invalid date') return 0;
    else if (a.lastActivity === 'Invalid date') return 1;
    else if (b.lastActivity === 'Invalid date') return -1;
    else return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
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

    await Competition.find({}, async (err, competitions) => {
      allComps = await compAnalysis(competitions);
    });

    await ClickTracking.find({}, (err, clicks) => {
      allClicks = clickAnalysis(clicks);
    });

    const response = {
      ident: process.env.ADMIN_KEY,
      users: allUsers,
      comps: allComps,
      clicks: allClicks,
    };

    res.json(response);
  } else {
    res.json({ login: 'failed' });
  }
};

exports.getUsers = async (req, res) => {
  var allUsers = [];
  var adminData = {};

  await Admin.find({}, (err, data) => {
    adminData = data;
  });

  await User.find({}, (err, users) => {
    allUsers = userAnalysis(users);
  });

  console.log(allUsers);

  res.json({ status: 'success' });
};

async function getMailStats(startDate, endDate, category) {
  const request = {};
  const queryParams = {
    aggregated_by: 'day',
    end_date: endDate, //format = '2019-03-05'
    limit: 1,
    offset: 1,
    start_date: startDate, //format = '2019-03-05'
    category,
  };
  request.qs = queryParams;
  request.method = 'GET';
  request.url = '/v3/stats';

  var resBody = undefined;

  await client.request(request).then(([response, body]) => {
    resBody = body;
  });
  return resBody;
}

async function getEmailCategories() {
  const request = {};
  const queryParams = {
    //no params
  };
  request.qs = queryParams;
  request.method = 'GET';
  request.url = '/v3/categories';

  var resCategories = undefined;

  await client.request(request).then(([response, body]) => {
    resCategories = body;
  });
  return resCategories;
}

exports.getMailStats = async (req, res) => {
  var emailCategories = await getEmailCategories();
  console.log(emailCategories);

  res.json({ emailCategories });
};
