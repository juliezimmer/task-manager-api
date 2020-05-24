const sgMail = require('@sendgrid/mail');

// Associates my API Key with the email I send /my account. 
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// email to send when a user signs up for the task manager service
const sendWelcomeEmail = (email, name) => {
   sgMail.send({
      to: email,
      from: 'julie.berthiaume@gmail.com',
      subject: 'Thanks for joining!',
      text: `Welcome to the app, ${name}. Let us know how you like it.`
   })
};

// email sent to user when they drop out of task manager app
const sendCancelationEmail = (email, name) => {
   sgMail.send({
      to: email,
      from: 'julie.berthiaume@gmail.com',
      subject: 'Sorry to see you go',
      text: `Goodbye, ${name}. We hope you return soon!`
   })
};

// set up as an object because several functions will be exported
module.exports = {
   sendWelcomeEmail,
   sendCancelationEmail
}
