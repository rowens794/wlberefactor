/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
const moment = require('moment');
const Sentry = require('@sentry/node');

const User = mongoose.model('User');
const Competition = mongoose.model('Competition');
const mail = require('../email/email');

const referenceDate = moment(new Date())
  .subtract(1, 'days')
  .format('M/D/YYYY');

function collectCompetitionInfo(competition) {
  var returnObject = {
    startDate: competition.StartDate,
    totalDays: null,
    prizePool: null,
    interPrizeOffset: null,
    interPrize: null,
    grandPrizes: [],
    interimPrizeAwardDates: [],
    weekEndDates: [],
    competitionEndDate: null,
  };

  // determine the frequency of interim prizes and their amounts
  switch (competition.InterimPrize) {
    case '52W':
      returnObject.interPrizeOffset = 14;
      returnObject.interPrize = competition.Players.length * competition.EntryFee * 0.05;
      break;
    case '54W':
      returnObject.interPrizeOffset = 28;
      returnObject.interPrize = competition.Players.length * competition.EntryFee * 0.05;
      break;
    case '104W':
      returnObject.interPrizeOffset = 28;
      returnObject.interPrize = competition.Players.length * competition.EntryFee * 0.1;
      break;
    default:
      returnObject.interPrizeOffset = null;
      returnObject.interPrize = 0;
  }

  // calculate total days in competition
  switch (competition.CompetitionLength) {
    case '8 Weeks':
      returnObject.totalDays = 8 * 7;
      break;
    case '12 Weeks':
      returnObject.totalDays = 12 * 7;
      break;
    case '16 Weeks':
      returnObject.totalDays = 16 * 7;
      break;
    default:
      returnObject.totalDays = 20 * 7;
  }

  // calculate grand prize awards
  returnObject.prizePool = competition.Players.length * competition.EntryFee;
  var totalInterimPrizes = 0;
  if (returnObject.interPrizeOffset) {
    totalInterimPrizes = returnObject.interPrize * (returnObject.totalDays / returnObject.interPrizeOffset - 1);
  }

  switch (competition.Payout) {
    case '1':
      returnObject.grandPrizes.push(returnObject.prizePool - totalInterimPrizes);
      break;
    case '2':
      returnObject.grandPrizes.push((returnObject.prizePool - totalInterimPrizes) * 0.75, (returnObject.prizePool - totalInterimPrizes) * 0.25);
      break;
    default:
      returnObject.grandPrizes.push(
        (returnObject.prizePool - totalInterimPrizes) * 0.6,
        (returnObject.prizePool - totalInterimPrizes) * 0.25,
        returnObject.prizePool - totalInterimPrizes * 0.15,
      );
  }

  // //calculate the competition week-end dates to determine when emails are sent
  for (let j = 0; j <= returnObject.totalDays; j += 7) {
    returnObject.weekEndDates.push(
      moment(new Date(returnObject.startDate))
        .add(j, 'days')
        .format('M/D/YYYY'),
    );
  }

  // calculate the competition week-end dates to determine when emails are sent
  if (returnObject.interPrizeOffset) {
    for (let j = returnObject.interPrizeOffset; j < returnObject.totalDays; j += returnObject.interPrizeOffset) {
      returnObject.interimPrizeAwardDates.push(
        moment(new Date(returnObject.startDate))
          .add(j, 'days')
          .format('M/D/YYYY'),
      );
    }
  }

  // competiton end date calculation
  returnObject.competitionEndDate = returnObject.weekEndDates[returnObject.weekEndDates.length - 1];

  // return the populated object
  return returnObject;
}

const findAndEmailPlayer = async (competition, player) => {
  await User.findOne({ email: player[1] }, async (err, participant) => {
    if (err) {
      Sentry.captureMessage(`CRON: error finding ${player[1]}`);
    }
    console.log(`------${participant.name}: ${participant.emailsEnabled}`);
    // send reminder email (name | email | comp name | comp ID | player ID)
    if (participant.emailsEnabled === false) {
      console.log('---------No email sent');
    } else {
      console.log('---------Email sent');
      await mail.sendReminderEmail(participant.name, participant.email, competition.CompetitionName, competition.id, participant.id);
    }
  });
};

const cyclePlayers = async (players, competition) => {
  for (let j = 0; j < players.length; j += 1) {
    await findAndEmailPlayer(competition, players[j]);
  }
};

const cycleCompetitions = async (competitions) => {
  for (let i = 0; i < competitions.length; i += 1) {
    const competitionInfo = collectCompetitionInfo(competitions[i]);
    console.log(competitions[i].CompetitionName);
    if (competitionInfo.weekEndDates.indexOf(moment(new Date()).format('M/D/YYYY')) >= 0) {
      console.log(`---Weigh-in Today`);
      await cyclePlayers(competitions[i].Players, competitions[i]);
    }
  }
};

exports.sendRemindEmails = async (req, res) => {
  // collect all competitions
  Competition.find({}, async (competitionRetrievalError, competitions) => {
    if (competitionRetrievalError) {
      Sentry.captureMessage('CRON: error retrieving competitions');
      res.json({ status: 'failed' });
    }

    cycleCompetitions(competitions);
  });

  res.json({ status: 'success' });
};

// ------------------------------------------------------------------

function testWeighIns(currentPeriod, previousPeriod) {
  if (currentPeriod && previousPeriod) {
    var totalLoss = (((currentPeriod - previousPeriod) / previousPeriod) * 100).toFixed(2);
  } else {
    var totalLoss = 'N/A';
  }
  return totalLoss;
}

function getUserInfo(competition, refDate) {
  var userList = [];

  for (let i = 0; i < competition.Players.length; i += 1) {
    const fourWeeksAgoDate = moment(new Date(refDate))
      .subtract(28, 'days')
      .format('M/D/YYYY');
    const twoWeeksAgoDate = moment(new Date(refDate))
      .subtract(14, 'days')
      .format('M/D/YYYY');
    const lastWeekDate = moment(new Date(refDate))
      .subtract(7, 'days')
      .format('M/D/YYYY');
    const startDate = moment(new Date(competition.StartDate)).format('M/D/YYYY');

    // grab weights from individual user objects
    const mostRecentWeighin = competition.Players[i][2][refDate];
    const previousWeekWeighin = competition.Players[i][2][lastWeekDate];
    const twoWeeksAgoWeighin = competition.Players[i][2][twoWeeksAgoDate];
    const fourWeeksAgoWeighin = competition.Players[i][2][fourWeeksAgoDate];
    const initialWeighIn = competition.Players[i][2][startDate];

    // test the values of weighins to ensure a weighin wasn't missed
    const weeklyLoss = testWeighIns(mostRecentWeighin, previousWeekWeighin);
    const twoWeekLoss = testWeighIns(mostRecentWeighin, twoWeeksAgoWeighin);
    const fourWeekLoss = testWeighIns(mostRecentWeighin, fourWeeksAgoWeighin);
    const totalLoss = testWeighIns(mostRecentWeighin, initialWeighIn);

    userList.push({
      name: competition.Players[i][0],
      email: competition.Players[i][1],
      weeklyLoss,
      twoWeekLoss,
      fourWeekLoss,
      totalLoss,
    });
  }

  return userList;
}

function sortCompetitionUserInfo(userInfo, period) {
  // function will sort the competitionUserInfo object in one of four ways
  // by 1 week loss, 2 week loss, 4 week loss, or by total loss
  var key = '';
  switch (period) {
    case 'one':
      key = 'weeklyLoss';
      break;
    case 'two':
      key = 'twoWeekLoss';
      break;
    case 'four':
      key = 'fourWeekLoss';
      break;
    default:
      key = 'totalLoss';
  }

  userInfo.sort((a, b) => {
    return parseFloat(a[key]) - parseFloat(b[key]);
  });

  return userInfo;
}

const determineEmailTypeToSend = async (competition, player) => {
  var competitionInfo = collectCompetitionInfo(competition);
  const refDate = referenceDate;
  const players = getUserInfo(competition, competitionInfo, refDate);
  // if yesterday was last day of competititon then send winner announcement
  if (refDate === competitionInfo.competitionEndDate) {
    const focusUser = player;
    const sortedUsers = sortCompetitionUserInfo(players, 'total');
    const competitionName = competition.CompetitionName;
    const lookback = 'total';
    mail.sendWinnerAnnouncement(focusUser, sortedUsers, competitionInfo, competitionName, lookback);
    console.log(`${competitionName} send Winner announcement`);
  } else if (competitionInfo.interimPrizeAwardDates.indexOf(refDate) >= 0) {
    const focusUser = player;
    const sortedUsers = sortCompetitionUserInfo(players, 'total');
    const competitionName = competition.CompetitionName;
    const lookback = 'total';
    mail.sendInterimAnnouncement(focusUser, sortedUsers, competitionInfo, competitionName, lookback);
    console.log(`${competitionName} send Interim announcement`);
  } else {
    const focusUser = player;
    const sortedUsers = sortCompetitionUserInfo(players, 'total');
    const competitionName = competition.CompetitionName;
    mail.sendWeeklyReminder(focusUser, sortedUsers, competitionInfo, competitionName);
    console.log(`${competitionName} send Weekly announcement`);
  }
};

const findAndEmailPlayerReview = async (competition, player) => {
  await User.findOne({ email: player[1] }, async (err, participant) => {
    if (err) {
      Sentry.captureMessage(`CRON: error finding ${player[1]}`);
    }
    console.log(`------${participant.name}: ${participant.emailsEnabled}`);

    if (participant.emailsEnabled === false) {
      // Do not send Review Email
      console.log('---------No email sent');
    } else {
      // Send Review Email
      console.log('---------Email Will Send');
      await determineEmailTypeToSend(competition, player);
    }
  });
};

const cyclePlayersReview = async (players, competition) => {
  for (let j = 0; j < players.length; j += 1) {
    await findAndEmailPlayerReview(competition, players[j]);
  }
};

const cycleCompetitionsReview = async (competitions) => {
  for (let i = 0; i < competitions.length; i += 1) {
    // 1. collect meaningful dates for the competition
    const competitionInfo = collectCompetitionInfo(competitions[i]);

    // 2. determine if today is a day that emails should be sent
    var refDate = referenceDate;
    var emailDay = competitionInfo.weekEndDates.indexOf(refDate);

    if (emailDay !== -1 && emailDay !== 0) {
      //if this is not an email day then skip this competition
      await cyclePlayersReview(competitions[i].Players, competitions[i]);
    }
  }
};

exports.sendReviewEmails = async (req, res) => {
  Competition.find({}, async (competitionRetrievalError, competitions) => {
    if (competitionRetrievalError) {
      Sentry.captureMessage('CRON: error retrieving competitions');
      res.json({ status: 'failed' });
    }

    cycleCompetitionsReview(competitions);
  });

  res.json({ status: 'success' });
};
