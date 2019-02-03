const mongoose = require('mongoose');
const User = mongoose.model('User');
var md5 = require('md5');
const jwt = require('jsonwebtoken');
const Competition = mongoose.model('Competition');

const mail = require('./mailController');

var exports = module.exports = {};


exports.userValidation = function (req, res, next) {
    req.sanitizeBody('name');
    req.checkBody('name', 'you must supply a name').notEmpty();
    
    const errors = req.validationErrors();
    if (errors){
        res.json({message: errors.msg})

    }else{
        next
    }
};

exports.userRegistration = async function (req, res) {

    await User.register(
        {   username:req.body.email, 
            email:req.body.email, 
            name: req.body.name, 
            verified: false, 
            verificationString: md5(Math.random()*100000000),
            emailsEnabled: true
        },  req.body.password, function(err, user) {

        if (err) { 
            res.json({message: 'A user with the given username is already registered'})

        } else{
            //send a welcome email with verification string to new user
            mail.sendWelcomeEmail(user.email, user._id, user.name, user.verificationString)
    
            //authenticate the user
            var authenticate = User.authenticate();
            authenticate('username', 'password', function(err, result) {
                if (err) { 
                    console.log(err)
                }else{
                    //once authenticated send user to registration recieved page
                    res.json({message: 'success'})
                }
            });
        }
    });
};