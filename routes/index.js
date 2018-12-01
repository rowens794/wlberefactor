//node module imports
var express = require('express');
var router = express.Router(); //routing
var passport = require('passport')
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const moment = require('moment');
const User = mongoose.model('User');
const Competition = mongoose.model('Competition');

//my code imports
var userController = require('../controllers/userController');

/* ----------------- Routes ------------------ */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

//create user account
router.post('/registration', function(req, res, next) {
	//add user form validation -- wes bos video
	userController.userValidation(req, res, next);
	userController.userRegistration(req, res);
});


router.post('/signin', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) { return next(err)}

		if (!user) { 
			return res.json(JSON.stringify({login: 'failed'}));
		}

		req.logIn(user, function(err) {
			if (err) return console.log(err);
            var cert = process.env.JWT_KEY;

            const ExpirationInSections = 60 * 60 * 24 * 7 //token lasts for 7 days
            let tokenExp = new Date();
            tokenExp.setSeconds(tokenExp.getSeconds() + ExpirationInSections);
            tokenExp = new Date(tokenExp).getTime();
            
			jwt.sign({ userID: user._id }, cert, { expiresIn: ExpirationInSections }, function(err, token) {
                if (err) return res.send(err);
				let response = {token: token, userID: user._id, tokenExp: tokenExp};
                return res.json(response);
			});
		});
	})(req, res, next);
});

router.post('/verifyToken', function(req, res, next) {
	// /verifyToken takes in a jwt and returns valid user
    const decoded = jwt.verify(req.body.token, process.env.JWT_KEY);
    res.send(decoded);
});

router.post('/userData', function(req, res, next) {
	//userData takes in a jwt and returns the users data

	const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
	User.findById(userTokenID.userID, function (err, user) {
		if (err) res.json({"status":"failed"})
		res.json(user);
	});
});

router.post('/userCompData', function(req, res, next) {
	//userCompData takes in a jwt and returns the users data
	const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
	User.findById(userTokenID.userID, function (err, user) {
		if (err) res.json({"status":"failed"})
		res.json(user);
	});
});

router.post('/compData', function(req, res, next) {
	//retrieves competition data based on comp ID
	const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
	User.findById(userTokenID.userID, function (err, user) {
		if (err) res.json({"status":"failed"})
		Competition.findById(req.body.competitionId, function (err, competition) {
			res.json(competition);
		})
	});
});

router.post('/updateCompData', function(req, res, next) {
	//retrieves competition data based on comp ID
	const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);

	//verify user by token
	User.findById(userTokenID.userID, function (err, user) {
		if (err) res.json({"status":"failed"})
		var email = user.username

		//if user is legit then find competition by ID
		Competition.findById(req.body.competitionId, function (err, competition) {
			for (let i=0; i<competition.Players.length; i++) {

				//find the user in the competition by email
				if (email == competition.Players[i][1]){
					// we have to do some data wrangling with the users information
					let updateDate = Object.keys(req.body.updateFields)[0]
					let newWeight = req.body.updateFields[updateDate]
					competition.Players[i][2][updateDate] = newWeight
					//once the users data is updated then mark the document as modified and resave to DB
					competition.markModified('Players');
					competition.save(function(err, competition){
						if (err){
							//not currently handling this error as it won't affect DB or userexperience on front end
							console.log(err)	
						} else{
							console.log('competition updated successfully')
						}

					})
				}
			}
			//send a json of the updated competition back to front end to update users screen
			res.json(competition);
		})
	});
});

router.post('/createCompetition', async function(req, res, next) {
	// /createCompetition takes in form data and creates a new competition

	//verify the users token
	const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);  

	//set start date variable
	let x = moment(req.body.competitionInfo.StartDate); 

	//determine # of days in competition
	let days = 0
	if(req.body.competitionInfo.Length == '8 Weeks') days = 7 * 8
	if(req.body.competitionInfo.Length == '12 Weeks') days = 7 * 12
	if(req.body.competitionInfo.Length == '16 Weeks') days = 7 * 16
	if(req.body.competitionInfo.Length == '20 Weeks') days = 7 * 20

	//create date object
	let dates = {}
	for (i=0; i<days; i++){
		dates[x.add(1, 'days').format('M/D/YYYY')]= null
	}

	//append date object to each player
	let players = req.body.competitionInfo.Players

	for (i=0; i<players.length; i++){
		players[i].push(dates)
	} 

	//create a new competition from the form info that is delivered to server
	competition = new Competition({
		CompetitionName:  req.body.competitionInfo.CompetitionName,
		EntryFee: req.body.competitionInfo.EntryFee,
		Payout: req.body.competitionInfo.Payout,
		InterimPrize: req.body.competitionInfo.InterimPrize,
		StartDate: req.body.competitionInfo.StartDate,
		CompetitionLength: req.body.competitionInfo.Length,
		Players: req.body.competitionInfo.Players,
		DateObj: dates,
	});

	let id = competition._id + '' //convert competition ID to string 
	let responseObj = '' //initialize a response object to store err/succes response

	await competition.save().then( //save the competition
		User.findOneAndUpdate({_id: userTokenID.userID}, //then grab the user and append the competition to the user that created the competition
			{$addToSet: { competitions: {id: id, name: competition.CompetitionName} }}, //save comp ID and Name to user document
			function (err) {
				if (err) {responseObj = {"status":"failed"}} //mark res obj as success or failure
				else {
					responseObj = {"status":"success"}
				}
		}).catch(responseObj = {"status":"failed"}) //this error is hit if users messes with their jwt in local storage
	).catch(responseObj = {"status":"failed"})

	res.json(responseObj)
});

module.exports = router;
