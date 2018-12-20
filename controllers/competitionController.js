const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const Competition = mongoose.model('Competition');
var normalizeEmail = require('normalize-email')

const mail = require('./mailController');


var exports = module.exports = {};

exports.createCompetition = async function (req, res) {
    console.log('----------competitionController.createCompetition-----------')

    console.log(req.body)
    console.log(req.body.competitionInfo.Players)


    console.log('-------------------------------------------------------')
    
    //verify the users token
    const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);  

    //get the creating users info
    User.findById(userTokenID.userID, async function (err, admin) {
		if (err) res.json({"status":"failed"})
        
        //createCompetition takes in form data and creates a new competition


        //set start date variable
        let x = moment(new Date(req.body.competitionInfo.StartDate)); 

        
        //determine # of days in competition
        let days = 0
        if(req.body.competitionInfo.Length == '8 Weeks') days = 7 * 8
        if(req.body.competitionInfo.Length == '12 Weeks') days = 7 * 12
        if(req.body.competitionInfo.Length == '16 Weeks') days = 7 * 16
        if(req.body.competitionInfo.Length == '20 Weeks') days = 7 * 20

        
        //create invites object and add players to it
        let invites = req.body.competitionInfo.Players
        
        
        //create date object
        let dates= {[x.format('M/D/YYYY')]: null}
        for (i=0; i<days; i++){
            dates[x.add(1, 'days').format('M/D/YYYY')]= null
        }
    

        //create the admin and add them to the players list
        let adminObject = []
        adminObject.push(admin.name)
        adminObject.push(admin.email)
        adminObject.push(dates)


        //create a new competition from the form info that is delivered to server
        competition = new Competition({
            CompetitionName:  req.body.competitionInfo.CompetitionName,
            EntryFee: req.body.competitionInfo.EntryFee,
            Payout: req.body.competitionInfo.Payout,
            InterimPrize: req.body.competitionInfo.InterimPrize,
            StartDate: req.body.competitionInfo.StartDate,
            CompetitionLength: req.body.competitionInfo.Length,
            Players: [adminObject],
            DateObj: dates,
            Invites: invites,
            Admin: admin.email
        });
    
        let id = competition._id + '' //convert competition ID to string 
        let responseObj = '' //initialize a response object to store err/success response
    
        await competition.save().then( //save the competition
            User.findOneAndUpdate({_id: userTokenID.userID}, //then grab the user and append the competition to the user that created the competition
                {$addToSet: { competitions: {id: id, name: competition.CompetitionName, admin: true} }}, //save comp ID and Name to user document
                async function (err) {
                    if (err) {responseObj = {"status":"failed"}} //mark res obj as success or failure
                    else {

                        //send emails to each of the players in the competition and add them to the competition object
                        for(i=0; i<invites.length; i++){
                            console.log(`${i} cycling through competition participants`)

                            //if statement setup to catch situation where admin also includes themselves in email list form
                            if(normalizeEmail(admin.email) === normalizeEmail(invites[i][1])){
                                console.log('Admin Email - Skip processing')

                            }else{
                                var player = invites[i]
                                var email = player[1]
                                var name = player[0]
    
                                //lookup the user and either add the hunt to their dashboard or send them a signup email
                                await User.findOne({'email': email}, function (err, invitedUser) {
                                    if (err) {
                                        console.log('error finding user')
                                        throw err;
                                    }
    
                                    if (invitedUser) {
                                        console.log(`found user: ${invitedUser.name}`)
                                        //add invited player to the competition
                                        competition.Players.push([invitedUser.name, invitedUser.username, dates])
                                        competition.markModified('Players')
                                        competition.save()
    
                                        //add competition to invited player
                                        invitedUser.competitions.push({id: competition._id, name: competition.CompetitionName, admin: false})
                                        invitedUser.markModified('competitions')
                                        invitedUser.save()
    
                                        //email the invited user to let them know they've been added to a competition
                                        mail.sendYouveBeenAddedEmail(email, invitedUser.name, admin.name)
                                        
                                    }else{
                                        //send email to new user
                                        console.log(`did not find user ${invites[i]}`)
                                        console.log("-------------------------")
                                        console.log(invitedUser)
                                        mail.sendJoinCompEmail(email, name, admin.name, id)
                                    }
                                });
                            }
                        }
                        responseObj = {"status":"success"}
                    }
            }).catch(responseObj = {"status":"failed"}) //this error is hit if users messes with their jwt in local storage
        ).catch(responseObj = {"status":"failed"})
    
        res.json(responseObj)
        
    })
}

exports.addUser = async function (req, res) {
    console.log('----------competitionController.addUser-----------')
    console.log(req.body.newUser)
    
    //verify the users token
    const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);  
    console.log(userTokenID)

    var compID = req.body.newUser.compID
    var newUserName = req.body.newUser.name
    var newUserEmail = req.body.newUser.email
    console.log('----------------------')
    console.log(compID)
    console.log(newUserName)
    console.log(newUserEmail)


    //get the creating users info
    User.findById(userTokenID.userID, async function (err, user) {
        if (err) res.json({"status":"failed"})
        else{
            //verify that the user actually has the competition
            var userHasComp = false 
            for (i=0; i<user.competitions.length; i++){
                if (user.competitions[i].id === compID && user.competitions[i].admin){
                    userHasComp = true
                }
            }

            if (!userHasComp){
                //if user doesn't have competition and/or is not admin send an error response
                res.json({"status":"failed"})

            }else{
                //lookup the user and either add the hunt to their dashboard or send them a signup email
                await User.findOne({'email': newUserEmail}, function (err, invitedUser) {
                    if (err) {
                        console.log('error finding user')
                        throw err;
                    }

                    if (invitedUser) {
                        //add invited player to the competition
                        competition.Players.push([invitedUser.name, invitedUser.username, dates])
                        competition.markModified('Players')
                        competition.save()

                        //add competition to invited player
                        invitedUser.competitions.push({id: competition._id, name: competition.CompetitionName, admin: false})
                        invitedUser.markModified('competitions')
                        invitedUser.save()

                        //email the invited user to let them know they've been added to a competition
                        mail.sendYouveBeenAddedEmail(newUserEmail, newUserName, user.name)
                        
                    }else{
                        //send email to new user
                        mail.sendJoinCompEmail(newUserEmail, newUserName, user.name, compID)
                    }
                });

                //send success response back to frontend 
                res.json({"status":"success"})
            }            
        }
    })
}

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
    await addCompToAdmin(adminUser.id, competitionDoc.id, competitionDoc.CompetitionName)

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


function addCompToAdmin(adminID, compID, compName){
    console.log("---------addCompToAdmin----------")
    User.findById(adminID, function (err, user){
        if(err){console.log('error finding admin')}
        else{
            user.competitions.push({id:compID, name:compName, admin: true })
            user.markModified('competitions')
            user.save()
        }
    })
}

async function inviteeNotification(invitedPlayers, competition){
    console.log("---------inviteeNotification----------")
    var invitedPlayers = invitedPlayers

    //for each invited player determine if that player exists in the DB
    for(i=0; i<invitedPlayers.length; i++){
        await User.find({email: invitedPlayers[i][1]}, function(err, user){
            if (err) {
                console.log(err)
            }
            else if(user){ 
                console.log('found user')
                //invitedUser = user[0] 
                competition = await processExistingParticipant(invitedUser, competition)

            }
            else{
                console.log('new user')
                await processNewParticipant(invitedPlayers[i][1], invitedPlayers[i][0], competition.Players[0][0], competition.id)
            }
        })
        
        // //if user exists: add user to the competition, save the competition to the users DB Object and notify user by email
        // console.log(`${invitedPlayers[i]} : ${invitedUser}`)
        // if(invitedUser){
        //     await mail.sendYouveBeenAddedEmail(invitedUser.email, invitedUser.name, competition.Players[0][0])
        //     await competition.Players.push([invitedUser.name, invitedUser.email, competition.DateObj])
        //     await competition.markModified('Players')
        //     await invitedUser.competitions.push({id: competition.id, name: competition.CompetitionName, admin: false})
        //     await invitedUser.markModified('competitions')
        //     await invitedUser.save()
        // }
        // //if no user exists then send an invitation to the user
        // else{
        //     //await mail.sendJoinCompEmail(invitedPlayers[i][1], invitedPlayers[i][0], competition.Players[0][0], competition.id)
        //     await processNewParticipant(invitedPlayers[i][1], invitedPlayers[i][0], competition.Players[0][0], competition.id)
        // }
    }
    return competition
}

async function processNewParticipant(email, name, admin, competitionID){
    console.log('email')
    console.log(email)
    console.log('name')
    console.log(name)

    mail.sendJoinCompEmail(email, name, admin, competitionID)
}

async function processExistingParticipant(invitedUser, competition){
    //1. send you've been added email
    mail.sendYouveBeenAddedEmail(invitedUser.email, invitedUser.name, competition.Players[0][0])

    //2. add player to competition
    competition.Players.push([invitedUser.name, invitedUser.email, competition.DateObj])
    competition.markModified('Players')

    //3. add competition to player
    invitedUser.competitions.push({id: competition.id, name: competition.CompetitionName, admin: false})
    invitedUser.markModified('competitions')
    invitedUser.save()

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

    return competition

}