var mongoose = require('mongoose');
var validator = require('validator');
var Schema = mongoose.Schema;

var competitionSchema = new Schema({
    CompetitionName:  {
        type: String,
        trim: true,
        required: 'a competition name is required' },
    EntryFee: {
        type: String,
        required: true,
        trim: true },
    Payout: {
        type: String,
        required: true,
        trim: true },
    InterimPrize: {
        type: String,
        required: true,
        trim: true },
    StartDate: String,
    CompetitionLength: {
        type: String,
        required: true,
        trim: true },
    Players: [[]],
});

mongoose.model('Competition', competitionSchema);
var Competition = mongoose.model('Competition');

module.exports = Competition;