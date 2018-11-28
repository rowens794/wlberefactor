//node module imports
var express = require('express');
var router = express.Router(); //routing
var passport = require('passport')
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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
	console.log('sign in hit')

	passport.authenticate('local', function(err, user, info) {
		if (err) { 
			console.log("------1-------");
			console.log(err)
			return next(err); 
		}

		if (!user) { 
            console.log("------2-------");
			return res.json(JSON.stringify({login: 'failed'}));
		}

		req.logIn(user, function(err) {
            console.log("------3-------");
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
	console.log("url hit---------------");
    console.log(req.body);
    
    const decoded = jwt.verify(req.body.token, process.env.JWT_KEY);
    console.log(decoded);

    res.send(decoded);

});

router.post('/userData', function(req, res, next) {
	const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
	console.log(userTokenID.userID)
	User.findById(userTokenID.userID, function (err, user) {
		if (err) res.json({"status":"failed"})
		console.log(user)
		res.json(user);
	});
});

router.post('/userCompData', function(req, res, next) {
	const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);
	console.log(userTokenID.userID)
	User.findById(userTokenID.userID, function (err, user) {
		if (err) res.json({"status":"failed"})
		console.log(user)
		res.json(user);
	});
});

router.post('/createCompetition', async function(req, res, next) {
	//verify the users token
	const userTokenID = jwt.verify(req.body.token, process.env.JWT_KEY);  

	//create a new competition from the form info that is delivered to server
	competition = new Competition({
		CompetitionName:  req.body.competitionInfo.CompetitionName,
		EntryFee: req.body.competitionInfo.EntryFee,
		Payout: req.body.competitionInfo.Payout,
		InterimPrize: req.body.competitionInfo.InterimPrize,
		StartDate: req.body.competitionInfo.StartDate,
		CompetitionLength: req.body.competitionInfo.Length,
		Players: req.body.competitionInfo.Players,
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
