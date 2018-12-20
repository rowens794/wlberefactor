const sgMail = require('@sendgrid/mail');

exports.sendWelcomeEmail = function (email, userID, name, verificationString, competitionID) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.setSubstitutionWrappers('{{', '}}')
    // console.log('----------mailController.sendWelcomeEmail-----------')

    // if (competitionID != undefined){
    //     var htmlString = `<strong>Welcome to Big Loosers!</strong><br /><p>Starting and joining a Weightloss competition with your friends and family is easy. All that you need to do to get start is click the following registration link to confirm your email address.</p><a href=${process.env.SERVER_URL + '/userVerification/' + userID + '/' + verificationString + '?comp=' + competitionID}>verify email`
    // }
    // else{
    //     var htmlString = `<strong>Welcome to Big Loosers!</strong><br /><p>Starting and joining a Weightloss competition with your friends and family is easy. All that you need to do to get start is click the following registration link to confirm your email address.</p><a href=${process.env.SERVER_URL + '/userVerification/' + userID + '/' + verificationString}>verify email`
    // }

    // const msg = {
    //     to: email,
    //     from: 'Ryan@bigloosers.com',
    //     subject: 'Welcome to Big Loosers - Verification',
    //     text: `Welcome to Big Loosers! Starting and joining a Weightloss competition with your friends and family is easy. All that you need to do to get start is click the following registration link to confirm your email address. ${process.env.SERVER_URL + 'userVerification' + userID + '/' + verificationString}`,
    //     html: htmlString    
    // };

    // sgMail.send(msg, (error, msg) => {
    //     if(error){
    //         console.log('0')
    //     }else{
    //         console.log('confirmation message sent successfully to ')
    //         console.log(email)
    //     }
    // });

    const msg = {
        to: email,
        from: 'ryan@flippingthescales.com',
        subject: 'Welcome to Flipping The Scales - Verification',
        text: 'Welcome to Flipping The Scales - Verification',
        templateId: 'd-44519cf99b874974b6d561b52a0c9648',
        personalizations: [
            {data:{
                name: name,
                userId: userID,
                verificationString: verificationString }
                }
            ]}
      sgMail.send(msg);
}

exports.sendJoinCompEmail = function (email, name, invitor, competitionID) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('----------mailController.sendJoinCompEmail-----------')

    const msg = {
        to: email,
        from: 'Ryan@bigloosers.com',
        subject: "You've been Invited to a Weightloss Competition",
        text: `Hi ${name}, You've been Invited to a Weightloss Competition by ${invitor}.  To join, follow this link and create your own account: ${rootURL}joinacompetition/${competitionID}`,
        html: `<strong>You've been Invited to a Weightloss Competition</strong><br /><p>Hi ${name}, ${invitor} has invited you to join a weightloss competition. To join, follow this link and create your own account: <a href=${rootURL}joinacompetition/${competitionID}>Create Account</p>`,
    };

    sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('0')
        }else{
            console.log('sendJoinCompEmail message sent successfully to ')
            console.log(email)
        }
    });
}

exports.sendYouveBeenAddedEmail = function (email, name, invitor) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('----------mailController.sendYouveBeenAddedEmail-----------')

    const msg = {
        to: email,
        from: 'Ryan@bigloosers.com',
        subject: `${invitor} has added you to a weightloss competition`,
        text: `Hi ${name}, ${invitor} has added you to a weightloss competition.  You don't need to do anything else to join, simply log-in to your account at ${rootURL} to begin logging your weighins`,
        html: `<strong>You've been Invited to a Weightloss Competition</strong><br /><p>Hi ${name}, ${invitor} has added you to a weightloss competition. To play, simply log into your account at <a href=${rootURL}>${rootURL}</a> and log your weight.</p>`,
    };

    sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('0')
        }else{
            console.log('youveBeenAddedEmail message sent successfully to ')
            console.log(email)
        }
    });
}

exports.resetPasswordEmail = function (email, link) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('----------mailController.resetPasswordEmail-----------')

    const msg = {
        to: email,
        from: 'Ryan@bigloosers.com',
        subject: `Reset Your Password`,
        text: `Visit the following link to reset your password: ${link}`,
        html: `<strong>Password Reset Link</strong><br /><p>Visit the following link to reset your password: <a href=${link}>Password Reset</a></p>`,
    };

    sgMail.send(msg, (error) => {
        if(error){
            console.log('0')
        }else{
            console.log('password reset sent successfully to ')
            console.log(email)
        }
    });
}


exports.sendWeeklyAnnouncement = function (index, sortedUsers, competitionInfo, competitionName, lookback) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    var leaderBoard = sortedUsers.map(user => {
        return `<li>${user.name} - ${user[[lookback]]} - ${user.totalLoss} </li>`
    })
    leaderBoard = leaderBoard.join('')

    const msg = {
        to: sortedUsers[index].email,
        from: 'Ryan@bigloosers.com',
        subject: `${competitionName} Congrats to `,

        text: `One more week down ${competitionName}.  Your percentage weight change for the week was ${sortedUsers[index][lookback]} and your total percentage weight change is ${sortedUsers[index].totalLoss}.  Keep working hard, you have until ${competitionInfo.competitionEndDate} to lose as much weight as you can.  As of right now, the leader of ${competitionName} is ${sortedUsers[0].name} with a total weight change of ${sortedUsers[0].totalLoss}.  `,
        
        html: `<strong>${competitionName} Weekly Update</strong><br /><p>Hi ${sortedUsers[index].name}, <br /> <br /> One more week down for the ${competitionName}.  Your percentage weight change for the week was ${sortedUsers[index][lookback]} and your total percentage weight change is ${sortedUsers[index].totalLoss}.  Keep working hard, you have until ${competitionInfo.competitionEndDate} to lose as much weight as you can.  As of right now, the leader of ${competitionName} is ${sortedUsers[0].name} with a total weight change of ${sortedUsers[0].totalLoss}.</p><ol>${leaderBoard}</ol>`,
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


exports.sendInterimAnnouncement = function (index, sortedUsers, competitionInfo, competitionName, lookback) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    var leaderBoard = sortedUsers.map(user => {
        return `<li>${user.name} - ${user[[lookback]]} - ${user.totalLoss} </li>`
    })
    leaderBoard = leaderBoard.join('')

    const msg = {
        to: sortedUsers[index].email,
        from: 'Ryan@bigloosers.com',
        subject: `${competitionName}: Congrats to ${sortedUsers[0].name}`,

        text: `Your percentage weight change for the period was ${sortedUsers[index][lookback]} and your total percentage weight change is ${sortedUsers[index].totalLoss}.  Keep working hard, you have until ${competitionInfo.competitionEndDate} to lose as much weight as you can.  ${sortedUsers[0].name} has been awarded $${competitionInfo.interPrize} for losing the highest percentage during the current period.`,
        
        html: `${competitionName}: Congrats to ${sortedUsers[0].name}</strong><br /><p>Hi ${sortedUsers[index].name}, <br /> <br /> Your percentage weight change for the period was ${sortedUsers[index][lookback]} and your total percentage weight change is ${sortedUsers[index].totalLoss}.  Keep working hard, you have until ${competitionInfo.competitionEndDate} to lose as much weight as you can.  ${sortedUsers[0].name} has been awarded $${competitionInfo.interPrize} for losing the highest percentage during the current period.</p><ol>${leaderBoard}</ol>`,
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


exports.sendWinnerAnnouncement = function (index, sortedUsers, competitionInfo, competitionName, lookback) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    var leaderBoard = sortedUsers.map(user => {
        return `<li>${user.name} - ${user[[lookback]]} - ${user.totalLoss} </li>`
    })
    leaderBoard = leaderBoard.join('')

    const msg = {
        to: sortedUsers[index].email,
        from: 'Ryan@bigloosers.com',
        subject: `${competitionName}: A Winner is Crowned`,

        text: `After many weeks and lots of pounds shed, a winner is finally crowned ${sortedUsers[0].name} has won the ${competitionName} by losing ${sortedUsers[0].totalLoss}% of their bodyweight. For their efforts, ${sortedUsers[0].name} wins the grand prize of $${competitionInfo.grandPrizes[0]}. You have lost a total of ${sortedUsers[index].totalLoss}%.`,
        
        html: `${competitionName}: Congrats to ${sortedUsers[0].name}</strong><br /><p>After many weeks and lots of pounds shed, a winner is finally crowned ${sortedUsers[0].name} has won the ${competitionName} by losing ${sortedUsers[0].totalLoss}% of their bodyweight. For their efforts, ${sortedUsers[0].name} wins the grand prize of $${competitionInfo.grandPrizes[0]}. You have lost a total of ${sortedUsers[index].totalLoss}%.</p><ol>${leaderBoard}</ol>`,
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
