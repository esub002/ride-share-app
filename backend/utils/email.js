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

// Gmail SMTP configuration
async function sendEmail({ to, subject, text, html, locale = 'en' }) {
  i18n.setLocale(locale);
  
  // Create Gmail transporter
  let transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your Gmail address
      pass: process.env.EMAIL_PASS || 'your-app-password'     // Your Gmail app password
    }
  });

  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to,
      subject: i18n.__(subject),
      text: i18n.__(text),
      html: i18n.__(html)
    });
    
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

module.exports = sendEmail;
