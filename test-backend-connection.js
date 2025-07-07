const fetch = require('node-fetch');
const https = require('https');
const http = require('http');

// Test backend connection
async function testBackend() {
  console.log('Testing backend connection...');
  
  try {
    // Test basic connection
    const response = await fetch('http://localhost:3000/api/auth/driver/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+1234567890'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend connection successful:', data);
    } else {
      console.log('❌ Backend error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
  }
}

testBackend(); 