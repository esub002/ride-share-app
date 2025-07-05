const axios = require('axios');

async function testOTP() {
  try {
    console.log('🧪 Testing OTP API...');
    
    // Test send OTP
    console.log('📤 Sending OTP...');
    const sendResponse = await axios.post('http://localhost:3001/api/auth/driver/send-otp', {
      phone: '+12345678901'
    });
    console.log('✅ Send OTP Response:', sendResponse.data);
    
    // Test verify OTP
    console.log('📥 Verifying OTP...');
    const verifyResponse = await axios.post('http://localhost:3001/api/auth/driver/verify-otp', {
      phone: '+12345678901',
      otp: '123456',
      name: 'Test Driver',
      car_info: 'Test Car'
    });
    console.log('✅ Verify OTP Response:', verifyResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOTP(); 