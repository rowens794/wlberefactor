const sgMail = require('@sendgrid/mail');
const moment = require('moment');

exports.sendWelcomeEmail = function (email, userID, name, verificationString, competitionID) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('----------mailController.sendWelcomeEmail-----------')

    if (competitionID != undefined){
        verificationString = verificationString + '?comp=' + competitionID
    }

    const msg = {
        to: email,
        from: 'Ryan@flippingthescales.com',
        subject: 'Welcome to Flipping The Scales - Verification',
        text: 'Welcome to Flipping The Scales - Verification',
        templateId: 'd-44519cf99b874974b6d561b52a0c9648',
        dynamic_template_data: {
                name: name,
                userId: userID,
                verificationString: verificationString 
            }
        }
    
        sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('-------error hit sendWelcomeEmail------------')
            console.log(error)
        }else{
            //console.log('sendWelcomeEmail message sent successfully to ')
            //console.log(email)
        }
    });
}

exports.sendJoinCompEmail = function (email, name, invitor, competitionID) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('----------mailController.sendJoinCompEmail-----------')

    //template access
    const msg = {
        to: email,
        from: 'Ryan@flippingthescales.com',
        subject: "You've been Invited to a Weightloss Competition",
        text: "You've been Invited to a Weightloss Competition",
        templateId: 'd-36191e3152884567a61ff6ee9aac6acb',
        dynamic_template_data: {
                name: name,
                invitor: invitor,
                compID: competitionID 
            }
        }
    
        sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('-------error hit sendJoinCompEmail------------')
            console.log(error)
        }else{
            //console.log('sendJoinCompEmail message sent successfully to ')
            //console.log(email)
        }
    });

}

exports.sendYouveBeenAddedEmail = async function (email, name, invitor, competitionName) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('----------mailController.sendYouveBeenAddedEmail-----------')

    //template access
    const msg = {
        to: email,
        from: 'Ryan@flippingthescales.com',
        subject: `${invitor} has added you to a weightloss competition`,
        text: `${invitor} has added you to a weightloss competition`,
        templateId: 'd-e303a08b2c1f490eb6c8044fb609a55d',
        dynamic_template_data: {
                name: name,
                invitor: invitor,
                email: email,
                competitionName: competitionName 
            }
        }
    
        sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('-------error hit sendYouveBeenAddedEmail------------')
            console.log(error.response.body)
        }else{
            //console.log('sendJoinCompEmail message sent successfully to ')
            //console.log(email)
        }
    });
}

exports.resetPasswordEmail = function (email, link) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('----------mailController.resetPasswordEmail-----------')

    //template access
    const msg = {
        to: email,
        from: 'PasswordReset@flippingthescales.com',
        subject: `Reset your Password`,
        text: `Reset your Password`,
        templateId: 'd-0366abeca49d48c5b1981e66853c30e9',
        dynamic_template_data: {
                link: link,
                email: email
            }
        }
    
        sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('-------error hit resetPasswordEmail------------')
            console.log(error)
        }else{
            //console.log('Password reset sent successfully to ')
            //console.log(email)
        }
    });
}


exports.sendWeeklyAnnouncement = function (focusUser, sortedUsers, competitionInfo, competitionName, lookback) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    //determine if focusUser missed weighin
    let focusUserMissedWeighIn = false
    if(focusUser[lookback] == 'N/A'){focusUserMissedWeighIn = true}

    //determine if focusUser missed weighin
    let focusUserIsLeader = false
    if(focusUser.email == sortedUsers[0].email){focusUserIsLeader = true}

    //template access
    const msg = {
        to: focusUser.email,
        from: 'weekly-updates@flippingthescales.com',
        templateId: 'd-1cb67f200cc345a09251588cfc319eaf',
        dynamic_template_data: {
                focusUser: focusUser,
                sortedUsers: sortedUsers,
                competitionInfo: competitionInfo,
                competitionName: competitionName,
                lookback: lookback,
                periodEnd: moment(new Date()).format('M/D/YY'),
                focusUserMissedWeighIn: focusUserMissedWeighIn,
                focusUserIsLeader: focusUserIsLeader
            }
        }
    
        sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('-------error hit sendWeeklyAnnouncement------------')
            console.log(error)
        }else{
            //console.log('sendWeeklyAnnouncement message sent successfully to ')
            //console.log(focusUser.email)
        }
    });
}


exports.sendInterimAnnouncement = function (focusUser, sortedUsers, competitionInfo, competitionName, lookback) {

    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    //determine if focusUser missed weighin
    let focusUserMissedWeighIn = false
    if(focusUser[lookback] == 'N/A'){focusUserMissedWeighIn = true}

    //determine if focusUser missed weighin
    let focusUserIsLeader = false
    if(focusUser.email == sortedUsers[0].email){focusUserIsLeader = true}

    //set the lookup string
    let lookupString = 'twoWeekLoss'
    let lookbackString = '2 weeks'
    if (competitionInfo.interPrizeOffset == 28){lookupString = 'fourWeekLoss'; lookbackString = '4 weeks'}

    let participantPeriodLosses = []
    sortedUsers.forEach(function(user){
        participantPeriodLosses.push({name: user.name, periodLoss: user[lookupString], totalLoss: user.totalLoss})
    })
    
    //template access
    const msg = {
        to: focusUser.email,
        from: 'weekly-updates@flippingthescales.com',
        templateId: 'd-762859d018464680b41e69cd29af031f',
        dynamic_template_data: {
                focusUser: focusUser,
                sortedUsers: sortedUsers,
                competitionInfo: competitionInfo,
                competitionName: competitionName,
                lookback: lookbackString,
                periodEnd: moment(new Date()).format('M/D/YY'),
                focusUserMissedWeighIn: focusUserMissedWeighIn,
                focusUserIsLeader: focusUserIsLeader,
                winner: {name: sortedUsers[0].name, periodLoss: sortedUsers[0][lookupString]},
                participantPeriodLosses: participantPeriodLosses
            }
        }
    
        sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('-------error hit sendInterimAnnouncement------------')
            console.log(error)
        }else{
            //console.log('sendInterimAnnouncement message sent successfully to ')
            //console.log(focusUser.email)
        }
    });
}


exports.sendWinnerAnnouncement = function (focusUser, sortedUsers, competitionInfo, competitionName, lookback) {
// using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    //determine if focusUser missed weighin
    let focusUserMissedWeighIn = false
    if(focusUser[lookback] == 'N/A'){focusUserMissedWeighIn = true}

    //determine if focusUser missed weighin
    let focusUserIsLeader = false
    if(focusUser.email == sortedUsers[0].email){focusUserIsLeader = true}

    //set object for top 3 placements
    let winnersObj = {  first:  {   exists: true,
                                    name: sortedUsers[0].name,
                                    totalLoss: sortedUsers[0].totalLoss,
                                    prize: competitionInfo.grandPrizes[0]}}
    winnersObj.second = {}
    winnersObj.third = {}

    if(competitionInfo.grandPrizes.length > 1){
        winnersObj.second.exists = true
        winnersObj.second.name = sortedUsers[1].name
        winnersObj.second.totalLoss = sortedUsers[1].totalLoss,
        winnersObj.second.prize = competitionInfo.grandPrizes[1]
    }else{
        winnersObj.second.exists = false
        winnersObj.second.name = null
        winnersObj.second.totalLoss = null
        winnersObj.second.prize = null
    }

    if(competitionInfo.grandPrizes.length > 2){
        winnersObj.third.exists = true
        winnersObj.third.name = sortedUsers[2].name
        winnersObj.third.totalLoss = sortedUsers[2].totalLoss,
        winnersObj.third.prize = competitionInfo.grandPrizes[2]
    }else{
        winnersObj.third.exists = false
        winnersObj.third.name = null
        winnersObj.third.totalLoss = null
        winnersObj.third.prize = null
    }

    //set ranking in sorted users object
    for(j=0; j<sortedUsers.length; j++){
        sortedUsers[j].rank = j+1
    }
    console.log(sortedUsers)

    //template access
    const msg = {
        to: focusUser.email,
        from: 'weekly-updates@flippingthescales.com',
        templateId: 'd-8c894da864ea4087b4b98b5c65761d5d',
        dynamic_template_data: {
                focusUser: focusUser,
                sortedUsers: sortedUsers,
                competitionInfo: competitionInfo,
                competitionName: competitionName,
                lookback: lookback,
                periodEnd: moment(new Date()).format('M/D/YY'),
                focusUserMissedWeighIn: focusUserMissedWeighIn,
                focusUserIsLeader: focusUserIsLeader,
                winnersObj: winnersObj
            }
        }
    
        sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('-------error hit sendWinnerAnnouncement------------')
            console.log(error)
        }else{
            //console.log('sendWinnerAnnouncement message sent successfully to ')
            //console.log(focusUser.email)
        }
    });
}

exports.sendReminderEmail = function(name, email, competitionName, competitionID, userID){
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('----------mailController.sendReminderEmail-----------')

    //template access
    const msg = {
        to: email,
        from: 'PasswordReset@flippingthescales.com',
        subject: `Record Your Weight Today`,
        text: `Record Your Weight Today`,
        templateId: 'd-dbcc5b6c08914ede9ba16f0394c2cdb9',
        dynamic_template_data: {
                name: name,
                email: email,
                competitionName: competitionName,
                competitionID: competitionID,
                userID: userID
            }
        }
    
        sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('-------error hit sendReminderEmail------------')
            console.log(error)
        }else{
            //console.log('sendReminderEmail sent successfully to ')
            //console.log(email)
        }
    });
}
