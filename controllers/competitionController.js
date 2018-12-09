const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const Competition = mongoose.model('Competition');

const mail = require('./mailController');


var exports = module.exports = {};

exports.createCompetition = async function (req, res) {

    
    //verify the users token
    const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);  
    console.log(userTokenID)
    

    //get the creating users info
    User.findById(userTokenID.userID, async function (err, user) {
		if (err) res.json({"status":"failed"})
        
        var admin = user
        console.log(admin)
        
        //createCompetition takes in form data and creates a new competition
        console.log('--------create competition----------')
        console.log(req.body.competitionInfo.Players)
        

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
        let dates = {}
        for (i=0; i<days; i++){
            dates[x.add(1, 'days').format('M/D/YYYY')]= null
        }
    

        //create the admin and add them to the players list
        console.log('-----admin object--------')
        console.log(user.name)
        console.log(user.email)
        console.log(dates)
        let adminObject = []
        adminObject.push(user.name)
        adminObject.push(user.email)
        adminObject.push(dates)
        console.log(adminObject)


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

                        //send emails to each of the players in the competition
                        for(i=0; i<invites.length; i++){
                            var player = invites[i]
                            console.log('preparing to send------------')
                            console.log(player)
                            var email = player[1]
                            var name = player[0]

                            //lookup the user and either add the hunt to their dashboard or send them a signup email
                            await User.findOne({'email': email}, function (err, user) {
                                if (err) {
                                    console.log('error finding user')
                                    throw err;
                                }
                                if (user) {
                                    //add competition to existing user
                                    
                                }else{
                                    //send email to new user
                                    mail.sendJoinCompEmail(email, name, admin.name, id)
                                }
                            });
                        }
                        responseObj = {"status":"success"}
                    }
            }).catch(responseObj = {"status":"failed"}) //this error is hit if users messes with their jwt in local storage
        ).catch(responseObj = {"status":"failed"})
    
        res.json(responseObj)
        
    })
}

