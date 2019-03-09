const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const clickTrackingSchema = new Schema({
  EmailName: String,
  UserID: String,
  LinkSource: String,
  ClickDate: Date,
});

mongoose.model('ClickTracking', clickTrackingSchema);
const ClickTracking = mongoose.model('ClickTracking');

module.exports = ClickTracking;
