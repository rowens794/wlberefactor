const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const adminSchema = new Schema({
  UsersLastSignedIn: {},
  NewUserAccounts: {},
  SalesLinkClicks: {},
  EmailsSent: {},
});

mongoose.model('Admin', adminSchema);
const Admin = mongoose.model('Admin');

module.exports = Admin;
