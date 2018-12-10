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
    
    //verify the users token
    const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);  

    //get the creating users info
    User.findById(userTokenID.userID, async function (err, user) {
		if (err) res.json({"status":"failed"})
        
        var admin = user
        
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
        adminObject.push(user.name)
        adminObject.push(user.email)
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
            Invites: invites
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

