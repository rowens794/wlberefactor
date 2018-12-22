var express = require('express');
var router = express.Router(); //routing
var passport = require('passport')
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Competition = mongoose.model('Competition');
var normalizeEmail = require('normalize-email')
var md5 = require('md5');
const jwt = require('jsonwebtoken');
const moment = require('moment');
var normalizeEmail = require('normalize-email')

const mail = require('./mailController');


exports.sendReviewEmails = async function (req, res){

    //collect all competitions
	Competition.find({}, async function(err, competitions){
        competitions.forEach( async function(competition, index){
            //1. collect meaningful dates for the competition
			let compInfo = await collectCompetitionInfo(competition)

            //2. determine if today is a day that emails should be sent
            var refDate = moment(new Date()).subtract(1,'days').format('M/D/YYYY')
            var emailDay = compInfo.weekEndDates.indexOf(refDate)

            //if (emailDay !== -1 && emailDay !== 0) { //if this is not an email day then skip this competition
            if (competition.CompetitionName === 'A bit Delayed') { //temporary if to select competition for testing
                
                
                //3. get a list of all of the users in the competition
                var competitionUserInfo = await userInfo(competition, compInfo, refDate)
    
                //4. otherwise send standard 1 week update

                
                //if yesterday = competition end date send winner announcement
                if (refDate === competition.competitionEndDate){
                    let sortedUsers = await sortCompetitionUserInfo(competitionUserInfo, 'total')
                    prepEmailNotifications(sortedUsers, compInfo, competition.CompetitionName, 'total')
                }
                // if yesterday = interim award date then figure out if it's 2 or 4 week lookback
                else if(compInfo.interimPrizeAwardDates.indexOf(refDate) >= 0){
                    if(compInfo.interPrizeOffset == 14){
                        let sortedUsers = await sortCompetitionUserInfo(competitionUserInfo, 'two')
                        prepEmailNotifications(sortedUsers, compInfo, competition.CompetitionName, 'two')
                    }
                    else{
                        let sortedUsers = await sortCompetitionUserInfo(competitionUserInfo, 'four')
                        prepEmailNotifications(sortedUsers, compInfo, competition.CompetitionName, 'four')
                    }
                }
                // if yesterday is not equal to competition end date or interim prize date then send one week lookback
                else{
                    let sortedUsers = await sortCompetitionUserInfo(competitionUserInfo, 'one')
                    prepEmailNotifications(sortedUsers, compInfo, competition.CompetitionName, 'one')
                }
            } 
        })
	})

    res.json({status:'success'})
}

function prepEmailNotifications(sortedUsers, compInfo, compName, timePeriod){

    sortedUsers.forEach(function(user) {
        switch(timePeriod){
            case ('one'):
                console.log('prepEmailNotifications: one')
                mail.sendWeeklyAnnouncement(user, sortedUsers, compInfo, compName, 'weeklyLoss')
                break
            case ('two'):
                console.log('prepEmailNotifications: two')
                mail.sendInterimAnnouncement(user, sortedUsers, compInfo, compName, 'two')
                break
            case ('four'):
                console.log('prepEmailNotifications: four')
                mail.sendInterimAnnouncement(user, sortedUsers, compInfo, compName, 'four')
                break
            case ('total'):
                console.log('prepEmailNotifications: total')
                mail.sendWinnerAnnouncement(user, sortedUsers, compInfo, compName, 'total')
                break
        }
    });

    // for(let l=0; l<sortedUsers.length; l++){
    //     let userIndex = l
    //     switch(timePeriod){
    //         case ('one'):
    //             console.log('prepEmailNotifications: one')
    //             mail.sendWeeklyAnnouncement(userIndex, sortedUsers, compInfo, compName, 'weeklyLoss')
    //             break
    //         case ('two'):
    //             console.log('prepEmailNotifications: two')
    //             mail.sendInterimAnnouncement(userIndex, sortedUsers, compInfo, compName, 'two')
    //             break
    //         case ('four'):
    //             console.log('prepEmailNotifications: four')
    //             mail.sendInterimAnnouncement(userIndex, sortedUsers, compInfo, compName, 'four')
    //             break
    //         case ('total'):
    //             console.log('prepEmailNotifications: total')
    //             mail.sendWinnerAnnouncement(userIndex, sortedUsers, compInfo, compName, 'total')
    //             break
    //     }
    // }
}

function sortCompetitionUserInfo(userInfo, period){
    //function will sort the competitionUserInfo object in one of four ways
    //by 1 week loss, 2 week loss, 4 week loss, or by total loss
    var key = ''
    switch(period){
        case 'one':
            key = 'weeklyLoss'
            break
        case 'two':
            key = 'twoWeekLoss'
            break
        case 'four':
            key = 'fourWeekLoss'
            break
        default:
            key = 'totalLoss'
    }

    userInfo.sort(function(a, b) {
        return parseFloat(a[key]) - parseFloat(b[key]);
    });

    return userInfo
}

function userInfo(competition, compInfo, refDate){
    var userList = []
    var biggestWeeklyLoser = null
    var biggestTotalLoser = null
    for (let k=0; k<competition.Players.length; k++){
        let fourWeeksAgoDate = moment(new Date(refDate)).subtract(28,'days').format('M/D/YYYY')
        let twoWeeksAgoDate = moment(new Date(refDate)).subtract(14,'days').format('M/D/YYYY')
        let lastWeekDate = moment(new Date(refDate)).subtract(7,'days').format('M/D/YYYY')
        let startDate = moment(new Date(competition.StartDate)).format('M/D/YYYY')
        
        //grab weights from individual user objects
        let mostRecentWeighin = competition.Players[k][2][refDate]
        let previousWeekWeighin = competition.Players[k][2][lastWeekDate]
        let twoWeeksAgoWeighin = competition.Players[k][2][twoWeeksAgoDate]
        let fourWeeksAgoWeighin = competition.Players[k][2][fourWeeksAgoDate]
        let initialWeighIn = competition.Players[k][2][startDate]

        //test the values of weighins to ensure a weighin wasn't missed
        var weeklyLoss = testWeighIns(mostRecentWeighin, previousWeekWeighin)
        var twoWeekLoss = testWeighIns(mostRecentWeighin, twoWeeksAgoWeighin)
        var fourWeekLoss = testWeighIns(mostRecentWeighin, fourWeeksAgoWeighin)
        var totalLoss = testWeighIns(mostRecentWeighin, initialWeighIn)

        userList.push(
            {   name: competition.Players[k][0], 
                email:competition.Players[k][1], 
                weeklyLoss: weeklyLoss, 
                twoWeekLoss: twoWeekLoss, 
                fourWeekLoss: fourWeekLoss, 
                totalLoss: totalLoss
            })
    }
    
    return userList
}


function testWeighIns(currentPeriod, previousPeriod){
    if(currentPeriod && previousPeriod){
        var totalLoss = ((currentPeriod - previousPeriod) / previousPeriod * 100).toFixed(2)
    }else{
        var totalLoss = 'N/A'
    }
    return totalLoss
}


function collectCompetitionInfo(competition){
    returnObject = {
        startDate: competition.StartDate,
        totalDays: null,
        prizePool: null,
        interPrizeOffset: null,
        interPrize: null,
        grandPrizes: [],
        interimPrizeAwardDates: [],
        weekEndDates: [],
        competitionEndDate: null
    }
    

    //determine the frequency of interim prizes and their amounts
    switch(competition.InterimPrize) {
        case '52W':
            returnObject.interPrizeOffset = 14
            returnObject.interPrize = competition.Players.length * competition.EntryFee * .05
            break
        case '54W':
            returnObject.interPrizeOffset = 28
            returnObject.interPrize = competition.Players.length * competition.EntryFee * .05
            break
        case '104W':
            returnObject.interPrizeOffset = 28
            returnObject.interPrize = competition.Players.length * competition.EntryFee * .1
            break
        default:
            returnObject.interPrizeOffset = null
            returnObject.interPrize = 0
    }

    //calculate total days in competition
    switch(competition.CompetitionLength) {
        case '8 Weeks':
            returnObject.totalDays = 8 * 7
            break
        case '12 Weeks':
            returnObject.totalDays = 12 * 7
            break
        case '16 Weeks':
            returnObject.totalDays = 16 * 7
            break
        default:
            returnObject.totalDays = 20 * 7
    }

    //calculate grand prize awards
    returnObject.prizePool = competition.Players.length * competition.EntryFee
    totalInterimPrizes = 0
    if (returnObject.interPrizeOffset){totalInterimPrizes = returnObject.interPrize * ((returnObject.totalDays / returnObject.interPrizeOffset) - 1)}

    switch(competition.Payout){
        case '1':
            returnObject.grandPrizes.push(returnObject.prizePool - totalInterimPrizes)
            break
        case '2':
            returnObject.grandPrizes.push((returnObject.prizePool - totalInterimPrizes) * .75, (returnObject.prizePool - totalInterimPrizes) * .25)
            break
        default:
            returnObject.grandPrizes.push((returnObject.prizePool - totalInterimPrizes) * .60, (returnObject.prizePool - totalInterimPrizes) * .25, returnObject.prizePool - totalInterimPrizes * .15)
    }

    // //calculate the competition week-end dates to determine when emails are sent
    for(let j=0; j<=returnObject.totalDays; j += 7){
        returnObject.weekEndDates.push(moment(new Date(returnObject.startDate)).add(j, 'days').format("M/D/YYYY"))
    }

    //calculate the competition week-end dates to determine when emails are sent
    if (returnObject.interPrizeOffset){
        for(j=returnObject.interPrizeOffset; j<returnObject.totalDays; j += returnObject.interPrizeOffset){
            returnObject.interimPrizeAwardDates.push(moment(new Date(returnObject.startDate)).add(j, 'days').format("M/D/YYYY"))
        }
    }

    //competiton end date calculation
    returnObject.competitionEndDate = returnObject.weekEndDates[returnObject.weekEndDates.length - 1]

    //return the populated object
    return returnObject
}
