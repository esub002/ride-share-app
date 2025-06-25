const sendEmail = require('./backend/utils/email.js');

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    
    await sendEmail({
      to: 'test@example.com', // Replace with your email
      subject: 'Test Email from RideShare App',
      text: 'This is a test email to verify the email configuration is working.',
      html: '<h1>Test Email</h1><p>This is a test email to verify the email configuration is working.</p>'
    });
    
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.log('\nMake sure you have:');
    console.log('1. Set EMAIL_USER and EMAIL_PASS environment variables');
    console.log('2. Enabled 2FA on your Gmail account');
    console.log('3. Generated an app password');
    console.log('4. Restarted your backend server');
  }
}

testEmail(); 