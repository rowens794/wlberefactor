const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const competitionSchema = new Schema({
  CompetitionName: {
    type: String,
    trim: true,
    required: 'a competition name is required',
  },
  EntryFee: {
    type: String,
    required: true,
    trim: true,
  },
  Payout: {
    type: String,
    required: true,
    trim: true,
  },
  InterimPrize: {
    type: String,
    required: true,
    trim: true,
  },
  StartDate: String,
  CompetitionLength: {
    type: String,
    required: true,
    trim: true,
  },
  Players: [[]],
  Invites: [[]],
  DateObj: {},
  Admin: String,
  CompetitionCreationDate: Date,
  LastCompetitionActivity: Date,
});

mongoose.model('Competition', competitionSchema);
const Competition = mongoose.model('Competition');

module.exports = Competition;
