const fetch = require('node-fetch');

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  
  try {
    // Test the health endpoint
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running and healthy:', data);
      return true;
    } else {
      console.log('❌ Backend responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return false;
  }
}

// Test both ports
async function testBothPorts() {
  console.log('Testing port 3000...');
  const port3000 = await testBackendConnection();
  
  console.log('\nTesting port 3001...');
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      console.log('✅ Backend is running on port 3001');
    } else {
      console.log('❌ Backend not responding on port 3001');
    }
  } catch (error) {
    console.log('❌ Backend not accessible on port 3001:', error.message);
  }
  
  if (port3000) {
    console.log('\n🎉 Backend is running on port 3000! Driver app should work now.');
  } else {
    console.log('\n⚠️ Backend is not running. Please start it with: cd backend && npm start');
  }
}

testBothPorts(); 