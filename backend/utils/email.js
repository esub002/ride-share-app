// email.js - Utility for sending emails (multi-language support)

const nodemailer = require('nodemailer');
const i18n = require('i18n');

// i18n config
i18n.configure({
  locales: ['en', 'es'],
  directory: __dirname + '/../locales',
  defaultLocale: 'en',
  objectNotation: true
});

// For demo/testing, use Ethereal. Replace with your SMTP for production.
async function sendEmail({ to, subject, text, html, locale = 'en' }) {
  i18n.setLocale(locale);
  let testAccount = await nodemailer.createTestAccount();
  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  let info = await transporter.sendMail({
    from: 'no-reply@rideshare.com',
    to,
    subject: i18n.__(subject),
    text: i18n.__(text),
    html: i18n.__(html)
  });
  console.log('Email sent:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}

module.exports = sendEmail;
