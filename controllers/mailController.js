const sgMail = require('@sendgrid/mail');

exports.sendWelcomeEmail = function (email, userID, verificationString, competitionID) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    console.log('-------------------')
    console.log(userID)

    if (competitionID != undefined){
        var htmlString = `<strong>Welcome to Big Loosers!</strong><br /><p>Starting and joining a Weightloss competition with your friends and family is easy. All that you need to do to get start is click the following registration link to confirm your email address.</p><a href=${process.env.SERVER_URL + '/userVerification/' + userID + '/' + verificationString + '?comp=' + competitionID}>verify email`
    }
    else{
        var htmlString = `<strong>Welcome to Big Loosers!</strong><br /><p>Starting and joining a Weightloss competition with your friends and family is easy. All that you need to do to get start is click the following registration link to confirm your email address.</p><a href=${process.env.SERVER_URL + '/userVerification/' + userID + '/' + verificationString}>verify email`
    }

    const msg = {
        to: email,
        from: 'Ryan@bigloosers.com',
        subject: 'Welcome to Big Loosers - Verification',
        text: `Welcome to Big Loosers! Starting and joining a Weightloss competition with your friends and family is easy. All that you need to do to get start is click the following registration link to confirm your email address. ${process.env.SERVER_URL + '/userVerification' + userID + '/' + verificationString}`,
        html: htmlString    
    };

    sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('0')
        }else{
            console.log('confirmation message sent successfully to ')
            console.log(email)
        }
    });
}

exports.sendJoinCompEmail = function (email, name, invitor, competitionID) {
    // using SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: email,
        from: 'Ryan@bigloosers.com',
        subject: "You've been Invited to a Weightloss Competition",
        text: `Hi ${name}, You've been Invited to a Weightloss Competition by ${invitor}.  To join, follow this link and create your own account: ${rootURL}/joinacompetition/${competitionID}`,
        html: `<strong>You've been Invited to a Weightloss Competition</strong><br /><p>Hi ${name}, ${invitor} has invited you to join a weightloss competition. To join, follow this link and create your own account: <a href=${rootURL}/joinacompetition/${competitionID}>Create Account</p>`,
    };

    sgMail.send(msg, (error, msg) => {
        if(error){
            console.log('0')
        }else{
            console.log('confirmation message sent successfully to ')
            console.log(email)
        }
    });
}


