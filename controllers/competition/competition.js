const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Sentry = require('@sentry/node');
const normalizeEmail = require('normalize-email');
const moment = require('moment');

const mail = require('../email/email');

const User = mongoose.model('User');
const Competition = mongoose.model('Competition');

function createCompetitionDocument(competitionDetails, adminUser) {
  // 1.1 set start date variable
  const x = moment(new Date(competitionDetails.StartDate));

  // 1.2 determine # of days in competition
  let days = 0;
  if (competitionDetails.Length === '8 Weeks') days = 7 * 8;
  if (competitionDetails.Length === '12 Weeks') days = 7 * 12;
  if (competitionDetails.Length === '16 Weeks') days = 7 * 16;
  if (competitionDetails.Length === '20 Weeks') days = 7 * 20;

  // 1.3 from start date interate to create object
  const dates = { [x.format('M/D/YYYY')]: null };
  for (let i = 0; i < days; i += 1) {
    dates[x.add(1, 'days').format('M/D/YYYY')] = null;
  }

  // 2.1 Parse the admin for inclusion in the competition
  const adminObject = [];
  adminObject.push(adminUser.name);
  adminObject.push(adminUser.email);
  adminObject.push(dates);

  // 2.2 Create the competition object from the form info that is delivered to server
  const competition = new Competition({
    CompetitionName: competitionDetails.CompetitionName,
    EntryFee: competitionDetails.EntryFee,
    Payout: competitionDetails.Payout,
    InterimPrize: competitionDetails.InterimPrize,
    StartDate: competitionDetails.StartDate,
    CompetitionLength: competitionDetails.Length,
    Players: [adminObject],
    DateObj: dates,
    Invites: competitionDetails.Players,
    Admin: adminObject.email,
    LastCompetitionActivity: new Date(),
    CompetitionCreationDate: new Date(),
  });

  return competition;
}

function cleanInvitedParticipants(invitedPlayers, adminUser) {
  // takes the list of players in a competition and removes duplicate users
  const adminEmail = normalizeEmail(adminUser.email);

  // duplicate list with only cleaned emails
  var cleanedEmails = [];
  for (let i = 0; i < invitedPlayers.length; i += 1) {
    const email = normalizeEmail(invitedPlayers[i][1]);
    cleanedEmails.push([invitedPlayers[i][0], email]);
  }

  // remove admin from invitedPlayers list if they were accidentally added
  var adminRemoved = [];
  for (let i = 0; i < cleanedEmails.length; i += 1) {
    if (cleanedEmails[i][1] !== adminEmail) adminRemoved.push(cleanedEmails[i]);
  }

  // remove any duplicate entries in invitedPlayers
  var noDuplicateEmails = [];
  var emailsOnly = [];
  for (let i = 0; i < adminRemoved.length; i += 1) {
    if (emailsOnly.indexOf(adminRemoved[i][1]) === -1) {
      noDuplicateEmails.push(adminRemoved[i]);
      emailsOnly.push(adminRemoved[i][1]);
    } else {
      return false;
    }
  }

  return noDuplicateEmails;
}

async function inviteeNotification(invitedPlayers, competition) {
  // for each invited player determine if that player exists in the DB
  invitedPlayers.forEach(async (invitedPlayer) => {
    await User.find({ email: invitedPlayer[1] }, async (err, participant) => {
      if (err) {
        Sentry.captureMessage(`COMPETITION: Error attempting to retrieve user record from db: ${invitedPlayer[1]}`);
      } else if (participant[0]) {
        const participantDoc = participant[0];

        // 1. send join notification
        await mail.sendYouveBeenAddedEmail(participantDoc.email, participantDoc.name, competition.Players[0][0], competition.CompetitionName);

        // 2. add player to competition
        await competition.Players.push([participantDoc.name, participantDoc.email, competition.DateObj]);
        await competition.markModified('Players');

        // 3. add competition to player
        participantDoc.competitions.push({ id: competition.id, name: competition.CompetitionName, admin: false });
        participantDoc.markModified();
        participantDoc.save();

        // 4. return competition object
        return competition;
      } else {
        await mail.sendJoinCompEmail(invitedPlayer[1], invitedPlayer[0], competition.Players[0][0], competition.id);
        return competition;
      }
      return competition;
    });
  });
  return competition;
}

async function addCompToAdmin(adminID, compID, compName) {
  await User.findById(adminID, async (err, user) => {
    if (err) {
      Sentry.captureMessage(`COMPETITION: Could not find Admin in DB: ${adminID}`);
    } else {
      await user.competitions.push({ id: compID, name: compName, admin: true });
      await user.markModified('competitions');
      await user.save();
    }
  });
}

function verifyAuthority(userDocument, competitionID) {
  let hasAuthority = false;
  for (let i = 0; i < userDocument.competitions.length; i += 1) {
    if (userDocument.competitions[i].id === competitionID && userDocument.competitions[i].admin === true) {
      hasAuthority = true;
    }
  }
  return hasAuthority;
}

exports.getCompData = async (req, res) => {
  // retrieves competition data based on comp ID
  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
  User.findById(userTokenID.userID, (userRetrievalError, user) => {
    if (userRetrievalError) {
      Sentry.captureMessage(`COMPETITION: Cannot retrieve user from jwt provided: ${userTokenID.userID}`);
      res.json({ status: 'failed' });
    }
    Competition.findById(req.body.competitionId, (competitionRetrievalError, competition) => {
      if (competitionRetrievalError) {
        Sentry.captureMessage(`COMPETITION: Cannot retrieve competition from db: ${req.body.competitionId}`);
        res.json({ status: 'failed' });
      }
      console.log('----------------------RetrievedUser-----------------------');
      const retrievedUser = user;
      console.log(retrievedUser);
      const retrievedCompetetition = competition;
      retrievedUser.lastActiveCompetition = req.body.competitionId;
      retrievedUser.lastSignIn = new Date();
      retrievedUser.save();
      console.log('----------------------RetrievedCompetition-----------------------');
      console.log(retrievedCompetetition);
      if (retrievedCompetetition) {
        retrievedCompetetition.LastCompetitionActivity = new Date();
        retrievedCompetetition.save();
        res.json(competition);
      } else {
        res.send('no competition Found');
      }
    });
  });
};

exports.getLimitedCompData = async (req, res) => {
  // retrieves competition data based on comp ID
  Competition.findById(req.body.competitionId, (competitionRetrievalError, competition) => {
    if (competitionRetrievalError) {
      Sentry.captureMessage(`COMPETITION: Cannon retrieve competition from db: ${req.body.competitionId}`);
      res.json({ status: 'failed' });
    } else {
      res.json(competition);
    }
  });
};

exports.updateComp = async (req, res) => {
  // retrieves competition data based on comp ID
  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);

  // verify user by token
  User.findById(userTokenID.userID, (userRetrievalError, user) => {
    if (userRetrievalError) {
      Sentry.captureMessage(`COMPETITION: Cannon retrieve user from jwt provided: ${userTokenID.userID}`);
      res.json({ status: 'failed' });
    }

    const email = normalizeEmail(user.username); // normalize the email so that formatting differences are ignored

    // if user is legit then find competition by ID
    Competition.findById(req.body.competitionId, (competitionRetrievalError, competition) => {
      if (competitionRetrievalError) {
        Sentry.captureMessage(`COMPETITION: Cannon retrieve competition: ${req.body.competitionId}`);
        res.json({ status: 'failed' });
      }

      const competitionObj = competition;

      // check for competition
      for (let i = 0; i < competition.Players.length; i += 1) {
        // find the user in the competition by email

        const competitionEmail = normalizeEmail(competition.Players[i][1]); // normalize the email so that formatting differences are ignored

        if (email === competitionEmail) {
          // we have to do some data wrangling with the users information
          const updateDate = Object.keys(req.body.updateFields)[0];
          const newWeight = req.body.updateFields[updateDate];
          competitionObj.Players[i][2][updateDate] = newWeight;
          // once the users data is updated then mark the document as modified and resave to DB
          competitionObj.markModified('Players');
          competitionObj.save((competitionSaveError, savedCompetition) => {
            if (competitionSaveError) {
              Sentry.captureMessage(`COMPETITION: Cannot retrieve competition: ${req.body.competitionId}`);
              res.json({ status: 'failed' });
            } else {
              // send a json of the updated competition back to front end to update users screen
              res.json(savedCompetition);
            }
          });
        }
      }
    });
  });
};

exports.createCompetition = async (req, res) => {
  // 1. verify the user token and store the ID'd user as the admin
  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);

  await User.findById(userTokenID.userID, async (userRetrievalError, user) => {
    if (userRetrievalError) {
      Sentry.captureMessage(`COMPETITION: Cannot retrieve user from jwt provided: ${userTokenID.userID}`);
      res.json({ status: 'failed' });
    } else {
      const adminUser = user;

      // 2. Create the competition document
      let competitionDoc = await createCompetitionDocument(req.body.competitionInfo, adminUser);

      // 3. Clean the list of invited participants
      const invitedPlayers = await cleanInvitedParticipants(req.body.competitionInfo.Players, adminUser);
      if (!invitedPlayers) res.json({ status: 'duplicateEmails' });

      // 4. Notify or Invite players that were selected to join the competition
      competitionDoc = await inviteeNotification(invitedPlayers, competitionDoc);

      // 5. Add the competition to the Admin user's DB document
      await addCompToAdmin(adminUser.id, competitionDoc.id, competitionDoc.CompetitionName);

      // 6. Save the Competition and Send success response
      await competitionDoc.save();
      res.json({ status: 'success' });
    }
  });
};

exports.addUserToCompetition = async (req, res) => {
  /*
    This function allows an admin to add a new player to an existing competition.  The Admin does so on their
    dashboard competition page, and that component hits this route.
  */

  // collect initial data
  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
  const { compID } = req.body.newUser;
  const newUserName = req.body.newUser.name;
  const newUserEmail = req.body.newUser.email;

  // 1. Get the users DB Document & verify token
  var adminUser = null;
  var response = { status: 'userInvited' };

  await User.findById(userTokenID.userID, (adminUserRetrievalError, admin) => {
    if (adminUserRetrievalError) {
      Sentry.captureMessage(`COMPETITION: Cannot retrieve admin: ${userTokenID.userID}`);
      response = { status: 'failed' };
    } else {
      adminUser = admin;
    }
  });

  // 2. collect the competition that the admin is attempting to add a user to
  var competitionDoc = null;
  await Competition.findById(compID, (competitionRetrievalError, competition) => {
    if (competitionRetrievalError) {
      response = { status: 'failed' };
    } else {
      competitionDoc = competition;
    }
  });

  // 3. verify the admin has authority to add user to competition
  if (!verifyAuthority(adminUser, compID)) {
    response = { status: 'failed' };
  } else {
    // 4. attempt to retrieve new users DB document
    var newUser = null;

    await User.find({ email: newUserEmail }, (userRetrievalError, user) => {
      if (userRetrievalError) {
        response = { status: 'failed' };
      } else if (user.length > 0) {
        newUser = user;
      }
    });

    // 5. test if new user is signed up and either add to comp or invite based on status
    if (newUser) {
      // 5.1 verify that newUser is not already signed up to compititon
      let alreadySignedUp = false;
      for (let i = 0; i < newUser.competitions.length; i += 1) {
        if (newUser.competitions[i].id === compID) {
          alreadySignedUp = true;
        }
      }

      if (!alreadySignedUp) {
        competitionDoc.Players.push([newUser.name, newUser.email, competitionDoc.DateObj]); // add newUser to comp
        newUser.competitions.push({ id: competitionDoc.id, name: competitionDoc.competitionName, admin: false });
        competitionDoc.markModified('Players');
        competitionDoc.save();
        newUser.markModified('competitions');
        newUser.save();
        mail.sendYouveBeenAddedEmail(newUser.email, newUser.name, adminUser.name, competitionDoc.CompetitionName);
        response = { status: 'success' };
      } else {
        response = { status: 'user already enrolled' };
      }
    } else {
      mail.sendJoinCompEmail(newUserEmail, newUserName, adminUser.name, competitionDoc.id);
    }
  }

  // 6. send success message to front end
  res.json(response);
};

exports.addUserToCompFromEmail = async (req, res) => {
  // collect initial data

  const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
  var compID = req.body.competitionId._id;

  // 1. Get the users DB Document & verify token
  var response = { status: 'userJoined' };

  await User.findById(userTokenID.userID, async (userRetrievalError, user) => {
    if (userRetrievalError) {
      Sentry.captureMessage(`COMPETITION: Cannot retrieve user: ${userTokenID.userID}`);
      response = { status: 'failed' };
    } else {
      // 2. collect the competition that the admin is attempting to add a user to
      await Competition.findById(compID, async (competitionRetrievalError, competition) => {
        if (competitionRetrievalError) {
          Sentry.captureMessage(`COMPETITION: Cannot retrieve competition: ${compID}`);
          response = { status: 'failed' };
        } else if (user) {
          // 5. test if new user is signed up and either add to comp or invite based on status
          // 5.1 verify that newUser is not already signed up to compititon
          var alreadySignedUp = false;
          for (let i = 0; i < user.competitions.length; i += 1) {
            if (user.competitions[i].id === compID) {
              alreadySignedUp = true;
            }
          }

          if (!alreadySignedUp) {
            competition.Players.push([user.name, user.email, competition.DateObj]); // add newUser to comp
            user.competitions.push({ id: competition.id, name: competition.CompetitionName, admin: false });
            competition.markModified('Players');
            competition.save();
            user.markModified('competitions');
            user.save();
            mail.sendYouveBeenAddedEmail(user.email, user.name, competition.CompetitionName);
            response = { status: 'success' };
          } else {
            response = { status: 'user already enrolled' };
          }
        } else {
          Sentry.captureMessage(`COMPETITION: Not User? ${user}`);
          response = { status: 'error enrolling user' };
        }
      });
    }
    // 6. send success message to front end
    res.json(response);
  });
};

exports.addCompetitionByID = async (req, res) => {
  // 1. verify the user token and store the ID'd user as the admin
  var token = req.body.userToken;
  var competitionID = req.body.competitionID;

  const userTokenID = await jwt.verify(token, process.env.JWT_KEY);
  var userDoc = null;
  var competitionDoc = null;
  var response = null;

  if (competitionID.match(/^[0-9a-fA-F]{24}$/)) {
    // competition id is valid
    await Competition.findById(competitionID, (err, competition) => {
      if (err || competition == null) {
        // competition does not exist
        response = { status: 'That ID does not match an existing competition.' };
      } else {
        // competition found
        competitionDoc = competition;
      }
    });
  } else {
    response = { status: "You've entered an invalid competition ID." };
  }

  if (userTokenID != null) {
    await User.findById(userTokenID.userID, (err, user) => {
      if (err || user == null) {
        response = { status: 'Error: You are no longer logged in. Please log in again.' };
      } else {
        userDoc = user;
      }
    });
  } else {
    response = { status: 'You have been logged out.  Please log back in.' };
  }

  if (userDoc && competitionDoc) {
    // check if user is already in competition
    var userAlreadyEnrolled = false;
    var dontAddComp = false;
    for (let i = 0; i < userDoc.competitions.length; i += 1) {
      if (competitionID === userDoc.competitions[i].id) {
        userAlreadyEnrolled = true;
      }
    }

    if (userAlreadyEnrolled) {
      dontAddComp = true;
    } else {
      const userSaveObj = { id: competitionDoc.id, name: competitionDoc.CompetitionName, admin: false };
      userDoc.competitions.push(userSaveObj);
      userDoc.markModified();
      userDoc.save();
    }

    // check if competition already has user
    var competitionHasUser = false;
    for (let j = 0; j < competitionDoc.Players.length; j += 1) {
      if (userDoc.email === competitionDoc.Players[j][1]) {
        competitionHasUser = true;
      }
    }

    if (competitionHasUser) {
      dontAddComp = true;
    } else {
      const competitionSaveObj = [userDoc.name, userDoc.email, competitionDoc.DateObj];
      competitionDoc.Players.push(competitionSaveObj);
      competitionDoc.markModified();
      competitionDoc.save();
    }

    if (!dontAddComp) {
      response = { status: `You have been added to ${competitionDoc.CompetitionName}` };
    } else {
      response = { status: `You are already enrolled in ${competitionDoc.CompetitionName} please check your dashboard.` };
    }
  }
  res.json(response);
};

async function deleteCompFromUser(userEmail, competitionID) {
  // function takes in an email and a competitionID and removes that competition from the user with given email
  await User.find({ email: userEmail }, (errFindingPlayer, playerFound) => {
    if (errFindingPlayer || playerFound == null) {
      Sentry.captureMessage(`DELETE COMPETITION: Could not find user ${userEmail}`);
    } else {
      const playerDoc = playerFound[0];
      if (playerDoc.competitions.length > 0) {
        for (let j = 0; j < playerDoc.competitions.length; j += 1) {
          if (playerDoc.competitions[j].id === competitionID) {
            playerDoc.competitions.splice(j, 1);
            if (playerDoc.lastActiveCompetition === competitionID) {
              playerDoc.lastActiveCompetition = null;
            }
            playerDoc.markModified();
          }
        }
      }
      playerDoc.save();
    }
  });
}

async function deleteUserFromComp(userEmail, competitionID) {
  // function takes in an email and a competitionID and removes that competition from the user with given email
  await Competition.findById(competitionID, (errFindingComp, compDoc) => {
    if (errFindingComp || compDoc == null) {
      Sentry.captureMessage(`DELETE COMPETITION: Could not find competition ${competitionID}`);
    } else {
      if (compDoc.Players.length > 0) {
        for (let j = 0; j < compDoc.Players.length; j += 1) {
          if (compDoc.Players[j][1] === userEmail) {
            compDoc.Players.splice(j, 1);
            compDoc.markModified();
          }
        }
      }
      compDoc.save();
    }
  });
}

exports.deleteCompetition = async (req, res) => {
  var token = req.body.token;
  var competitionID = req.body.competitionID;
  var admin = req.body.admin;
  var userDoc = null;
  var competitionLocation = null;

  // check if token is valid
  const userTokenID = await jwt.verify(token, process.env.JWT_KEY);

  // retrieve userDoc from db
  if (userTokenID != null) {
    await User.findById(userTokenID.userID, async (err, user) => {
      if (err || user == null) {
        res.json({ status: 'Error: User ID is not valid' });
      } else {
        userDoc = user;

        // Determin if user is Admin
        if (userDoc.competitions.length > 0) {
          for (let i = 0; i < userDoc.competitions.length; i += 1) {
            if (userDoc.competitions[i].id === competitionID) {
              admin = userDoc.competitions[i].admin;
            }
          }
        } else {
          res.json({ status: 'Error: User is not enrolled in competition' });
        }

        // check if user is admin
        if (admin) {
          // collect competition document
          await Competition.findById(competitionID, (err, competition) => {
            if (err || competition == null) {
              res.json({ status: 'Error: Competition ID is not valid' });
            } else {
              const competitionDoc = competition;
              const playerList = competition.Players;

              // delete competition from all other competition members
              playerList.forEach(async (player) => {
                const email = player[1];
                deleteCompFromUser(email, competitionID);
              });

              // delete competition
              competitionDoc.remove();
            }
          });
          res.json({ status: 'success' });
        } else {
          // user is not admin delete competition from user
          deleteCompFromUser(userDoc.email, competitionID);
          deleteUserFromComp(userDoc.email, competitionID);
          if (userDoc.lastActiveCompetition === competitionID) {
            userDoc.lastActiveCompetition = null;
          }
          res.json({ status: 'success' });
        }
      }
    });
  } else {
    res.json({ status: 'You have been logged out.  Please log back in.' });
  }
};
