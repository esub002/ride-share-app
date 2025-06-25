const fetch = require('node-fetch');

async function testRegistration() {
  const testData = {
    name: "Test Driver",
    email: "testdriver@example.com",
    password: "Test1234!",
    car_info: "Toyota Prius"
  };

  try {
    console.log('Testing driver registration...');
    console.log('Data:', testData);
    
    const response = await fetch('http://10.1.10.243:3000/api/auth/driver/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', data.error || data);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testRegistration(); 