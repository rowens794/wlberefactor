var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = mongoose.model( 'User', {
    email:  String,
    name: String,
    signUpDate: String,
    password: String,
});

module.exports = User;