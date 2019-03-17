const mongoose = require('mongoose');
const validator = require('validator');
const passportLocalMongoose = require('passport-local-mongoose');
const mongoDBErrorHandler = require('mongoose-mongodb-errors');

const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'invalid email address'],
    required: 'a valid email address is required',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'invalid email address'],
    required: 'a valid email address is required',
  },
  emailsEnabled: Boolean,
  signUpDate: Date,
  competitions: [],
  verified: Boolean,
  verificationString: String,
  lastActiveCompetition: String,
  lastSignIn: Date,
  marketingEmails: {
    lastSend: String,
    nextSend: String,
    nextEmailToSend: Number,
  },
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(mongoDBErrorHandler);

mongoose.model('User', userSchema);
const User = mongoose.model('User');

module.exports = User;
