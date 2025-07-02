// Test script to verify authentication with mock token
const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('🧪 Testing authentication with mock token...');
    
    const response = await fetch('http://localhost:3003/api/drivers/1/availability', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify({ available: true })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', data);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testAuth(); 