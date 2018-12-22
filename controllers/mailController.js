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
            console.log(error)
        }else{
            console.log('sendWelcomeEmail message sent successfully to ')
            console.log(email)
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
            console.log(error)
        }else{
            console.log('sendJoinCompEmail message sent successfully to ')
            console.log(email)
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
            console.log(error)
        }else{
            console.log('sendJoinCompEmail message sent successfully to ')
            console.log(email)
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
            console.log(error)
        }else{
            console.log('Password reset sent successfully to ')
            console.log(email)
        }
    });
}


exports.sendWeeklyAnnouncement = function (focusUser, sortedUsers, competitionInfo, competitionName, lookback) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    //determine if focusUser missed weighin
    let focusUserMissedWeighIn = false
    if(focusUser.email == sortedUsers[0].email){focusUserMissedWeighIn = true}

    //determine if focusUser missed weighin
    let focusUserIsLeader = false
    if(focusUser[lookback] == 'N/A'){focusUserIsLeader = true}

    //template access
    const msg = {
        to: focusUser.email,
        from: 'weekly-updates@flippingthescales.com',
        subject: ``,
        text: ``,
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
            console.log(error)
        }else{
            console.log('sendJoinCompEmail message sent successfully to ')
            console.log(email)
        }
    });
}


exports.sendInterimAnnouncement = function (focusUser, sortedUsers, competitionInfo, competitionName, lookback) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    var leaderBoard = sortedUsers.map(user => {
        return `<li>${user.name} - ${user[[lookback]]} - ${user.totalLoss} </li>`
    })
    leaderBoard = leaderBoard.join('')

    const msg = {
        to: focusUser.email,
        from: 'Ryan@bigloosers.com',
        subject: `${competitionName}: Congrats to ${sortedUsers[0].name}`,

        text: `Your percentage weight change for the period was ${focusUser[lookback]} and your total percentage weight change is ${focusUser.totalLoss}.  Keep working hard, you have until ${competitionInfo.competitionEndDate} to lose as much weight as you can.  ${sortedUsers[0].name} has been awarded $${competitionInfo.interPrize} for losing the highest percentage during the current period.`,
        
        html: `${competitionName}: Congrats to ${sortedUsers[0].name}</strong><br /><p>Hi ${focusUser.name}, <br /> <br /> Your percentage weight change for the period was ${focusUser[lookback]} and your total percentage weight change is ${focusUser.totalLoss}.  Keep working hard, you have until ${competitionInfo.competitionEndDate} to lose as much weight as you can.  ${sortedUsers[0].name} has been awarded $${competitionInfo.interPrize} for losing the highest percentage during the current period.</p><ol>${leaderBoard}</ol>`,
    };

    sgMail.send(msg, (error) => {
        if(error){
            console.log('0')
        }else{
            console.log('weekly email sent successfully to ')
            console.log(sortedUsers[index].email)
        }
    });
}


exports.sendWinnerAnnouncement = function (focusUser, sortedUsers, competitionInfo, competitionName, lookback) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    var leaderBoard = sortedUsers.map(user => {
        return `<li>${user.name} - ${user[[lookback]]} - ${user.totalLoss} </li>`
    })
    leaderBoard = leaderBoard.join('')

    const msg = {
        to: focusUser.email,
        from: 'Ryan@bigloosers.com',
        subject: `${competitionName}: A Winner is Crowned`,

        text: `After many weeks and lots of pounds shed, a winner is finally crowned ${sortedUsers[0].name} has won the ${competitionName} by losing ${sortedUsers[0].totalLoss}% of their bodyweight. For their efforts, ${sortedUsers[0].name} wins the grand prize of $${competitionInfo.grandPrizes[0]}. You have lost a total of ${focusUser.totalLoss}%.`,
        
        html: `${competitionName}: Congrats to ${sortedUsers[0].name}</strong><br /><p>After many weeks and lots of pounds shed, a winner is finally crowned ${sortedUsers[0].name} has won the ${competitionName} by losing ${sortedUsers[0].totalLoss}% of their bodyweight. For their efforts, ${sortedUsers[0].name} wins the grand prize of $${competitionInfo.grandPrizes[0]}. You have lost a total of ${focusUser.totalLoss}%.</p><ol>${leaderBoard}</ol>`,
    };

    sgMail.send(msg, (error) => {
        if(error){
            console.log('0')
        }else{
            console.log('weekly email sent successfully to ')
            console.log(focusUser.email)
        }
    });
}
