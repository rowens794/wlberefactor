const passport = require('passport');
LocalStrategy = require('passport-local').Strategy;
const User = require('../models/userSchema'); 

var exports = module.exports = {};

exports.userRegistration = function (req, res) {
    console.log(req.body);

    username = req.body.email;
    name = req.body.name;
    password = req.body.password;
    signUpDate = new Date();

    console.log('0');

    passport.use(new LocalStrategy(function(username, password, done) {
        console.log('1');

        User.findOne({ username: username }, function(err, user) {
    
            if (err) { return done(err); }

            console.log(user);
        
            if (!user) { 
                console.log("not user");
                usr = new User({ username: username, email: username, password: password });
                usr.save(function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log('user: ' + usr.username + " saved.");
                    }
                });
            }
        
            user.comparePassword(password, function(err, isMatch) {
                if (err) return done(err);
                if(isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Invalid password' });
                }
            });
        });
    }));

    res.redirect(rootURL + '/registrationrecieved')

}