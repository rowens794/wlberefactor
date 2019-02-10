const mongoose = require('mongoose');
const moment = require('moment');
const Sentry = require('@sentry/node');
const async = require('async');

const User = mongoose.model('User');
const Competition = mongoose.model('Competition');
const mail = require('../email/email');

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

    // competitions.forEach(async (competition) => {
    //   const competitionInfo = collectCompetitionInfo(competition);
    //   console.log(competition.CompetitionName);

    //   // determine if competition has a weighin due today
    //   // determine if today is a weekend date
    //   if (competitionInfo.weekEndDates.indexOf(moment(new Date()).format('M/D/YYYY')) >= 0) {
    //     console.log('---Weigh-in Today');
    //     // send email reminder to all participants

    //     competition.Players.forEach((player) => {
    //       console.log(`------${player[1]}`);
    //       User.findOne({ email: player[1] }, async (err, participant) => {
    //         console.log(`---------${participant.emailsEnabled}`);
    //         // send reminder email (name | email | comp name | comp ID | player ID)
    //         if (participant.emailsEnabled) {
    //           console.log('---------email sent');
    //           await mail.sendReminderEmail(participant.name, participant.email, competition.CompetitionName, competition.id, participant.id);
    //         }
    //       });
    //     });
    //   }
    // });
  });

  res.json({ status: 'success' });
};
