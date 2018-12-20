const mongoose = require('mongoose');
const User = mongoose.model('User');
var passport = require('passport');
var md5 = require('md5');
const Competition = mongoose.model('Competition');

const mail = require('./mailController');

var exports = module.exports = {};

exports.userRegistration = async function (req, res) {

    await User.register(
        {   username:req.body.email, 
            email:req.body.email, 
            name: req.body.name, 
            verified: false, 
            verificationString: md5(Math.random()*100000000)
        },  req.body.password, function(err, user) {
        if (err) { 
            console.log('error registering user from signup form')  
            console.log(err) 
        }


        //send a welcome email with verification string to new user
        mail.sendWelcomeEmail(user.email, user._id, user.name, user.verificationString)
        console.log('registration email sent')

        //authenticate the user
        var authenticate = User.authenticate();
        authenticate('username', 'password', function(err, result) {
            if (err) { 
                console.log('bottom error')  
                console.log(err)
            }
            
            //once authenticated send user to registration recieved page
            res.status(301).redirect(rootURL + 'registrationrecieved')
        });
    });
};

exports.userValidation = function (req, res, next) {
    req.sanitizeBody('name');
    req.checkBody('name', 'you must supply a name').notEmpty();
    
    const errors = req.validationErrors();
    if (errors){
        console.log(errors)
        res.redirect(rootURL+'register', errors);
    }
};

exports.signUpToCompetition = async function (req, res) {

    console.log(req.body)

    //create the new user
    await User.register(
        {   username:req.body.email, 
            email:req.body.email, 
            name: req.body.name, 
            verified: false, 
            verificationString: md5(Math.random()*100000000),
            competitions: []
        },  req.body.password, function(err, user) {

        //log any errors that occur registering the user
        if (err) { 
            console.log('error registering user from invitation')  
            console.log(err) 
        }

        //send a welcome email with verification string to new user
        mail.sendWelcomeEmail(user.email, user._id, user.name, user.verificationString, req.body.comp_id)

        //authenticate the user
        var authenticate = User.authenticate();
        authenticate('username', 'password', function(err, result) {
            if (err) { 
                console.log('an error occured authenticating the user')
                console.log(err)
                res.redirect(rootURL)
            }

            //-----Once the user has been registered and authenticated then add the user to the competition
            Competition.findById(req.body.comp_id, async function (err, competition) {
                if (err) {
                    console.log('an error occured finding the competition')
                    console.log(err)
                    res.redirect(rootURL)
                }else{
                    competition.Players.push([user.name, user.email, competition.DateObj ])
                    competition.markModified('Players');
                    competition.save()

                    //ALSO **IMPORTANT** Add the competition to the user
                    user.competitions.push({
                        "id": competition.id,
                        "name": competition.CompetitionName,
                        "admin": false
                    })
                    user.markModified('competitions')
                    user.save()

                    //once authenticated send user to registration recieved page
                    res.redirect(rootURL + 'registrationrecieved')
                }
            })
        })
    })
}
