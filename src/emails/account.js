const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ciohikari@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendDeleteEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ciohikari@gmail.com',
        subject: 'We\'re sorry to see you go!',
        text: `Hi ${name}. Could you tell us why you\'re leaving us?.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendDeleteEmail
}