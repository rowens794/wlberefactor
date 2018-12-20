const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const Competition = mongoose.model('Competition');
var normalizeEmail = require('normalize-email')

const mail = require('./mailController');


var exports = module.exports = {};

exports.createCompetitionRefac = async function (req, res) {
    console.log("---------createCompetitionRefac----------")

    //1. verify the user token and store the ID'd user as the admin
    var adminUser = null
    const userTokenID = await jwt.verify(req.body.token, process.env.JWT_KEY); 
    await User.findById(userTokenID.userID, function(err, user){
        if (err) {res.json({"status":"failed"})}
        else{ adminUser = user }
    })

    //2. Create the competition document
    var competitionDoc = await CreateCompetitionDocument(req.body.competitionInfo, adminUser)

    //3. Clean the list of invited participants
    var invitedPlayers = await cleanInvitedParticipants(req.body.competitionInfo.Players, adminUser)
    console.log(invitedPlayers)

    //4. Notify or Invite players that were selected to join the competition
    competitionDoc = await inviteeNotification(invitedPlayers, competitionDoc)

    //5. Add the competition to the Admin user's DB document
    let adminDone = await addCompToAdmin(adminUser.id, competitionDoc.id, competitionDoc.CompetitionName)
    console.log(adminDone)

    //6. Save the Competition and Send success response
    await competitionDoc.save()
    res.json({"status":"success"})
}


exports.addUserRefac = async function (req, res) {
    console.log("---------addUserRefac----------")

    //collect initial data
    const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);  
    var compID = req.body.newUser.compID
    var newUserName = req.body.newUser.name
    var newUserEmail = req.body.newUser.email

    //1. Get the users DB Document & verify token
    var adminUser = null
    var response = null

    await User.findById(userTokenID.userID, function(err, user) {if (err) {response = {"status":"failed"}} else{ adminUser = user }})

    //2. collect the competition that the admin is attempting to add a user to
    var competitionDoc = null
    await Competition.findById(compID, function(err, competition) {if (err) {response = {"status":"failed"}} else{ competitionDoc = competition }})

    //3. verify the admin has authority to add user to competition
    if(!verifyAuthority(adminUser, compID)) {response = {"status":"failed"}}

    //4. attempt to retrieve new users DB document
    var newUser = null
    await User.find({email: newUserEmail}, function(err, user) {if (err) {res.json({"status":"failed"})} else{ newUser = user[0] }})

    //5. test if new user is signed up and either add to comp or invite based on status
    if (newUser){
        
        //5.1 verify that newUser is not already signed up to compititon
        var alreadySignedUp = false
        for(i=0; i<newUser.competitions.length; i++){
            if(newUser.competitions[i].id === compID){
                alreadySignedUp = true
            }
        }

        if(!alreadySignedUp){
            console.log('user exists and is not already enrolled in competition')
            competitionDoc.Players.push([newUser.name, newUser.email, competitionDoc.DateObj]) // add newUser to comp
            newUser.competitions.push({id:competitionDoc.id, name:competitionDoc.competitionName, admin: false})
            competitionDoc.markModified('Players')
            competitionDoc.save()
            newUser.markModified('competitions')
            newUser.save()
            mail.sendYouveBeenAddedEmail(newUser.email, newUser.name, adminUser.name)
            response = {"status":"success"}
        }else{
            response = {"status":"user alread enrolled"}
        }

    }else{
        console.log('no user account')
        mail.sendJoinCompEmail(newUserEmail, newUserName, adminUser.name, competitionDoc.id)
    }

    //6. send success message to front end
    res.json(response)
}



function verifyAuthority(userDocument, competitionID){
    console.log("---------verifyAuthority----------")
    var hasAuthority = false
    for(i=0; i<userDocument.competitions.length; i++){
        if(userDocument.competitions[i].id === competitionID && userDocument.competitions[i].admin === true){
            hasAuthority = true
        }
    }
    return hasAuthority
}


async function addCompToAdmin(adminID, compID, compName){
    console.log("---------addCompToAdmin----------")
    console.log(`adminID: ${adminID} | compID: ${compID} | compName: ${compName}`)
    await User.findById(adminID, async function (err, user){
        if(err){console.log('error finding admin')}
        else{
            await user.competitions.push({id:compID, name:compName, admin: true })
            await user.markModified('competitions')
            await user.save()
        }
    })
    return true
}

async function inviteeNotification(invitedPlayers, competition){
    console.log("---------inviteeNotification----------")
    var invitedPlayers = invitedPlayers

    //for each invited player determine if that player exists in the DB
    console.table(invitedPlayers)
    console.log("------------begin for loop --------------")
    for(i=0; i<invitedPlayers.length; i++){
        console.log(`${i}: ${invitedPlayers[i]}`)
        await User.find({email: invitedPlayers[i][1]}, async function(err, user){
            if (err) {
                console.log(err)
            }
            else if(user){ 
                console.log('found user')
                console.log(user.name)
                //invitedUser = user[0] 
                competition = await processExistingParticipant(user, competition)

            }
            else{
                console.log('new user')
                let newParticipantAdded = await processNewParticipant(invitedPlayers[i][1], invitedPlayers[i][0], competition.Players[0][0], competition.id)
                console.log(newParticipantAdded)
            }
        })
    }

    return competition
}

async function processNewParticipant(email, name, admin, competitionID){
    console.log('----------processNewParticipant----------')
    console.log(`email: ${email} | name: ${name} | admin: ${admin} | competitionID: ${competitionID}`)
    await mail.sendJoinCompEmail(email, name, admin, competitionID)
    return true
}

async function processExistingParticipant(invitedUser, competition){
    console.log('----------processExistingParticipant----------')
    console.log(`invitedUser: ${invitedUser}`)
    //1. send you've been added email
    await mail.sendYouveBeenAddedEmail(invitedUser.email, invitedUser.name, competition.Players[0][0])

    //2. add player to competition
    await competition.Players.push([invitedUser.name, invitedUser.email, competition.DateObj])
    await competition.markModified('Players')

    //3. add competition to player
    await invitedUser.competitions.push({id: competition.id, name: competition.CompetitionName, admin: false})
    await invitedUser.markModified('competitions')
    await invitedUser.save()

    //4. return competition object
    return competition
}


//takes the list of players in a competition and removes duplicate users
function cleanInvitedParticipants(invitedPlayers, adminUser){
    console.log("---------cleanInvitedParticipants----------")
    adminEmail = adminUser.email

    //remove admin from invitedPlayers list if they were accidentally added
    for(i=0; i<invitedPlayers.length; i++){
        if (normalizeEmail(adminEmail) === normalizeEmail(invitedPlayers[i][1])){
            invitedPlayers.splice(i,1)
        }
    }

    //remove any duplicate entries in invitedPlayers
    for(i=0; i<invitedPlayers.length; i++){
        for(j=i+1; j<invitedPlayers.length; j++){
            if (normalizeEmail(invitedPlayers[i][1]) === normalizeEmail(invitedPlayers[j][1])){
                x = invitedPlayers.splice(j,1)
            }
        }
    }

    console.table(invitedPlayers)

    return invitedPlayers
}



function CreateCompetitionDocument(competitionDetails, adminUser){
    console.log("---------CreateCompetitionDocument----------")
    //1.1 set start date variable
    let x = moment(new Date(competitionDetails.StartDate));

    //1.2 determine # of days in competition
    let days = 0
    if(competitionDetails.Length == '8 Weeks') days = 7 * 8
    if(competitionDetails.Length == '12 Weeks') days = 7 * 12
    if(competitionDetails.Length == '16 Weeks') days = 7 * 16
    if(competitionDetails.Length == '20 Weeks') days = 7 * 20

    //1.3 from start date interate to create object
    let dates= {[x.format('M/D/YYYY')]: null}
    for (i=0; i<days; i++){
        dates[x.add(1, 'days').format('M/D/YYYY')]= null
    }

    //2.1 Parse the admin for inclusion in the competition
    let adminObject = []
    adminObject.push(adminUser.name)
    adminObject.push(adminUser.email)
    adminObject.push(dates)

    //2.2 Create the competition object from the form info that is delivered to server
    competition = new Competition({
        CompetitionName:  competitionDetails.CompetitionName,
        EntryFee: competitionDetails.EntryFee,
        Payout: competitionDetails.Payout,
        InterimPrize: competitionDetails.InterimPrize,
        StartDate: competitionDetails.StartDate,
        CompetitionLength: competitionDetails.Length,
        Players: [adminObject],
        DateObj: dates,
        Invites: competitionDetails.Players,
        Admin: adminObject.email
    });

    console.log(competition)

    return competition

}