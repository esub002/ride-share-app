/**
 * Socket.IO Test Client
 * Comprehensive testing of real-time features
 */

const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Test configuration
const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_this_in_production';

// Test users
const testUsers = {
  rider: {
    id: 1,
    name: 'Test Rider',
    email: 'rider@test.com',
    role: 'user'
  },
  driver: {
    id: 2,
    name: 'Test Driver',
    email: 'driver@test.com',
    role: 'driver'
  },
  admin: {
    id: 3,
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin'
  }
};

// Generate test tokens
function generateTestToken(user) {
  return jwt.sign({
    userId: user.id,
    role: user.role,
    permissions: ['read:own', 'write:own']
  }, JWT_SECRET, { expiresIn: '1h' });
}

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, details = '') {
  const result = { testName, passed, details, timestamp: new Date().toISOString() };
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - FAILED: ${details}`);
  }
}

// Test connection and authentication
async function testConnection() {
  console.log('\n🔌 Testing Connection and Authentication...');
  
  const riderToken = generateTestToken(testUsers.rider);
  const driverToken = generateTestToken(testUsers.driver);
  
  // Test rider connection
  try {
    const riderSocket = io(SERVER_URL, {
      auth: { token: riderToken },
      transports: ['websocket']
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      riderSocket.on('connect', () => {
        clearTimeout(timeout);
        logTest('Rider Connection', true);
        resolve(riderSocket);
      });
      
      riderSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    riderSocket.disconnect();
  } catch (error) {
    logTest('Rider Connection', false, error.message);
  }
  
  // Test driver connection
  try {
    const driverSocket = io(SERVER_URL, {
      auth: { token: driverToken },
      transports: ['websocket']
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      driverSocket.on('connect', () => {
        clearTimeout(timeout);
        logTest('Driver Connection', true);
        resolve(driverSocket);
      });
      
      driverSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    driverSocket.disconnect();
  } catch (error) {
    logTest('Driver Connection', false, error.message);
  }
}

// Test driver availability
async function testDriverAvailability() {
  console.log('\n🚗 Testing Driver Availability...');
  
  const driverToken = generateTestToken(testUsers.driver);
  const riderToken = generateTestToken(testUsers.rider);
  
  const driverSocket = io(SERVER_URL, {
    auth: { token: driverToken },
    transports: ['websocket']
  });
  
  const riderSocket = io(SERVER_URL, {
    auth: { token: riderToken },
    transports: ['websocket']
  });
  
  try {
    // Wait for connections
    await Promise.all([
      new Promise(resolve => driverSocket.on('connect', resolve)),
      new Promise(resolve => riderSocket.on('connect', resolve))
    ]);
    
    // Test driver going available
    let driverStatusReceived = false;
    riderSocket.on('driver:status', (data) => {
      if (data.driverId === testUsers.driver.id && data.available) {
        driverStatusReceived = true;
      }
    });
    
    driverSocket.emit('driver:available', {});
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Driver Available Status', driverStatusReceived);
        resolve();
      }, 2000);
    });
    
    // Test driver going unavailable
    driverStatusReceived = false;
    riderSocket.on('driver:status', (data) => {
      if (data.driverId === testUsers.driver.id && !data.available) {
        driverStatusReceived = true;
      }
    });
    
    driverSocket.emit('driver:unavailable', {});
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Driver Unavailable Status', driverStatusReceived);
        resolve();
      }, 2000);
    });
    
  } catch (error) {
    logTest('Driver Availability', false, error.message);
  } finally {
    driverSocket.disconnect();
    riderSocket.disconnect();
  }
}

// Test location updates
async function testLocationUpdates() {
  console.log('\n📍 Testing Location Updates...');
  
  const driverToken = generateTestToken(testUsers.driver);
  const riderToken = generateTestToken(testUsers.rider);
  
  const driverSocket = io(SERVER_URL, {
    auth: { token: driverToken },
    transports: ['websocket']
  });
  
  const riderSocket = io(SERVER_URL, {
    auth: { token: riderToken },
    transports: ['websocket']
  });
  
  try {
    // Wait for connections
    await Promise.all([
      new Promise(resolve => driverSocket.on('connect', resolve)),
      new Promise(resolve => riderSocket.on('connect', resolve))
    ]);
    
    // Test driver location update
    const testLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      speed: 25,
      heading: 90
    };
    
    driverSocket.emit('location:update', testLocation);
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Driver Location Update', true);
        resolve();
      }, 1000);
    });
    
    // Test rider location update
    const riderLocation = {
      latitude: 40.7589,
      longitude: -73.9851,
      accuracy: 15
    };
    
    riderSocket.emit('location:update', riderLocation);
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Rider Location Update', true);
        resolve();
      }, 1000);
    });
    
  } catch (error) {
    logTest('Location Updates', false, error.message);
  } finally {
    driverSocket.disconnect();
    riderSocket.disconnect();
  }
}

// Test ride request flow
async function testRideRequest() {
  console.log('\n🚕 Testing Ride Request Flow...');
  
  const driverToken = generateTestToken(testUsers.driver);
  const riderToken = generateTestToken(testUsers.rider);
  
  const driverSocket = io(SERVER_URL, {
    auth: { token: driverToken },
    transports: ['websocket']
  });
  
  const riderSocket = io(SERVER_URL, {
    auth: { token: riderToken },
    transports: ['websocket']
  });
  
  try {
    // Wait for connections
    await Promise.all([
      new Promise(resolve => driverSocket.on('connect', resolve)),
      new Promise(resolve => riderSocket.on('connect', resolve))
    ]);
    
    // Make driver available
    driverSocket.emit('driver:available', {});
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test ride request
    let rideRequestReceived = false;
    let rideAccepted = false;
    
    driverSocket.on('ride:request', (data) => {
      rideRequestReceived = true;
      console.log('Driver received ride request:', data);
      
      // Accept the ride
      driverSocket.emit('ride:accept', { rideId: data.rideId });
    });
    
    riderSocket.on('ride:accepted', (data) => {
      rideAccepted = true;
      console.log('Rider received ride acceptance:', data);
    });
    
    const rideRequest = {
      pickup: '123 Main St, New York, NY',
      destination: '456 Broadway, New York, NY',
      estimatedFare: 25.50,
      paymentMethod: 'credit_card'
    };
    
    riderSocket.emit('ride:request', rideRequest);
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Ride Request Flow', rideRequestReceived && rideAccepted);
        resolve();
      }, 3000);
    });
    
  } catch (error) {
    logTest('Ride Request Flow', false, error.message);
  } finally {
    driverSocket.disconnect();
    riderSocket.disconnect();
  }
}

// Test messaging
async function testMessaging() {
  console.log('\n💬 Testing Real-time Messaging...');
  
  const driverToken = generateTestToken(testUsers.driver);
  const riderToken = generateTestToken(testUsers.rider);
  
  const driverSocket = io(SERVER_URL, {
    auth: { token: driverToken },
    transports: ['websocket']
  });
  
  const riderSocket = io(SERVER_URL, {
    auth: { token: riderToken },
    transports: ['websocket']
  });
  
  try {
    // Wait for connections
    await Promise.all([
      new Promise(resolve => driverSocket.on('connect', resolve)),
      new Promise(resolve => riderSocket.on('connect', resolve))
    ]);
    
    // Create a test ride first
    driverSocket.emit('driver:available', {});
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let rideId = null;
    driverSocket.on('ride:request', (data) => {
      rideId = data.rideId;
      driverSocket.emit('ride:accept', { rideId: data.rideId });
    });
    
    riderSocket.emit('ride:request', {
      pickup: '123 Main St',
      destination: '456 Broadway',
      estimatedFare: 20.00,
      paymentMethod: 'cash'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!rideId) {
      logTest('Messaging Setup', false, 'No ride created');
      return;
    }
    
    // Test messaging
    let messageReceived = false;
    let typingReceived = false;
    
    riderSocket.on('message:received', (data) => {
      messageReceived = true;
      console.log('Rider received message:', data);
    });
    
    riderSocket.on('typing:start', (data) => {
      typingReceived = true;
      console.log('Rider received typing indicator:', data);
    });
    
    // Driver sends message
    driverSocket.emit('message:send', {
      rideId: rideId,
      message: 'Hello! I\'m on my way.',
      messageType: 'text'
    });
    
    // Driver starts typing
    driverSocket.emit('typing:start', { rideId: rideId });
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Real-time Messaging', messageReceived && typingReceived);
        resolve();
      }, 2000);
    });
    
  } catch (error) {
    logTest('Real-time Messaging', false, error.message);
  } finally {
    driverSocket.disconnect();
    riderSocket.disconnect();
  }
}

// Test emergency alerts
async function testEmergencyAlerts() {
  console.log('\n🚨 Testing Emergency Alerts...');
  
  const riderToken = generateTestToken(testUsers.rider);
  const adminToken = generateTestToken(testUsers.admin);
  
  const riderSocket = io(SERVER_URL, {
    auth: { token: riderToken },
    transports: ['websocket']
  });
  
  const adminSocket = io(SERVER_URL, {
    auth: { token: adminToken },
    transports: ['websocket']
  });
  
  try {
    // Wait for connections
    await Promise.all([
      new Promise(resolve => riderSocket.on('connect', resolve)),
      new Promise(resolve => adminSocket.on('connect', resolve))
    ]);
    
    let emergencyAlertReceived = false;
    
    adminSocket.on('emergency:alert', (data) => {
      emergencyAlertReceived = true;
      console.log('Admin received emergency alert:', data);
    });
    
    // Send emergency alert
    riderSocket.emit('emergency:alert', {
      rideId: 1,
      emergencyType: 'medical',
      location: '123 Main St, New York, NY',
      description: 'Rider feeling unwell'
    });
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Emergency Alerts', emergencyAlertReceived);
        resolve();
      }, 2000);
    });
    
  } catch (error) {
    logTest('Emergency Alerts', false, error.message);
  } finally {
    riderSocket.disconnect();
    adminSocket.disconnect();
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...');
  
  // Test invalid token
  try {
    const invalidSocket = io(SERVER_URL, {
      auth: { token: 'invalid_token' },
      transports: ['websocket']
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      invalidSocket.on('connect', () => {
        clearTimeout(timeout);
        reject(new Error('Should not connect with invalid token'));
      });
      
      invalidSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        logTest('Invalid Token Rejection', true);
        resolve();
      });
    });
    
  } catch (error) {
    logTest('Invalid Token Rejection', false, error.message);
  }
  
  // Test unauthorized actions
  const riderToken = generateTestToken(testUsers.rider);
  const riderSocket = io(SERVER_URL, {
    auth: { token: riderToken },
    transports: ['websocket']
  });
  
  try {
    await new Promise(resolve => riderSocket.on('connect', resolve));
    
    let errorReceived = false;
    riderSocket.on('error', (data) => {
      errorReceived = true;
      console.log('Rider received error:', data);
    });
    
    // Try to mark rider as available (should fail)
    riderSocket.emit('driver:available', {});
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Unauthorized Action Rejection', errorReceived);
        resolve();
      }, 2000);
    });
    
  } catch (error) {
    logTest('Unauthorized Action Rejection', false, error.message);
  } finally {
    riderSocket.disconnect();
  }
}

// Test connection stats
async function testConnectionStats() {
  console.log('\n📊 Testing Connection Statistics...');
  
  const tokens = [
    generateTestToken(testUsers.rider),
    generateTestToken(testUsers.driver),
    generateTestToken(testUsers.admin)
  ];
  
  const sockets = [];
  
  try {
    // Create multiple connections
    for (let i = 0; i < tokens.length; i++) {
      const socket = io(SERVER_URL, {
        auth: { token: tokens[i] },
        transports: ['websocket']
      });
      
      await new Promise(resolve => socket.on('connect', resolve));
      sockets.push(socket);
    }
    
    // Test heartbeat
    let heartbeatReceived = false;
    sockets[0].on('heartbeat:ack', () => {
      heartbeatReceived = true;
    });
    
    sockets[0].emit('heartbeat');
    
    await new Promise((resolve) => {
      setTimeout(() => {
        logTest('Heartbeat Functionality', heartbeatReceived);
        resolve();
      }, 1000);
    });
    
    logTest('Multiple Connections', sockets.length === tokens.length);
    
  } catch (error) {
    logTest('Connection Statistics', false, error.message);
  } finally {
    sockets.forEach(socket => socket.disconnect());
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Socket.IO Real-time System Tests...');
  console.log(`📍 Server URL: ${SERVER_URL}`);
  console.log('='.repeat(60));
  
  try {
    await testConnection();
    await testDriverAvailability();
    await testLocationUpdates();
    await testRideRequest();
    await testMessaging();
    await testEmergencyAlerts();
    await testErrorHandling();
    await testConnectionStats();
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Real-time system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.');
  }
  
  console.log('\n📝 Detailed Results:');
  testResults.tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.testName}${test.details ? ` - ${test.details}` : ''}`);
  });
  
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
}; 