var mongoose = require('mongoose');
var validator = require('validator');
const passportLocalMongoose = require('passport-local-mongoose');
const mongoDBErrorHandler = require('mongoose-mongodb-errors');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username:  {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'invalid email address'],
        required: 'a valid email address is required' },
    name: {
        type: String,
        required: true,
        trim: true },
    email: {
        type: String,
        required: true,
        trim: true },
    signUpDate: String,
    competitions: [],
    verified: Boolean,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(mongoDBErrorHandler);

mongoose.model('User', userSchema);
var User = mongoose.model('User');

module.exports = User;