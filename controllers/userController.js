const mongoose = require('mongoose');
const User = mongoose.model('User');
var passport = require('passport');

var exports = module.exports = {};

exports.userRegistration = async function (req, res) {
    await User.register({username:req.body.email, email:req.body.email, name: req.body.name, active: false}, req.body.password, function(err, user) {
        if (err) { 
            console.log('top error')  
            console.log(err) 
        }
      
        var authenticate = User.authenticate();

        authenticate('username', 'password', function(err, result) {
          if (err) { 
            console.log('bottom error')  
            console.log(err)
        }

        res.redirect(rootURL + '/registrationrecieved')

        });
    });
};

exports.userValidation = function (req, res, next) {
    req.sanitizeBody('name');
    req.checkBody('name', 'you must supply a name').notEmpty();
    
    const errors = req.validationErrors();
    if (errors){
        console.log(errors)
        res.redirect(rootURL+'/register', errors);
    }
};
