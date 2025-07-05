#!/usr/bin/env node

const io = require('socket.io-client');
const axios = require('axios');

console.log('🧪 Real-Time Features Test Suite\n');

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 10000;

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    
    if (response.status === 200 && response.data.status === 'healthy') {
      logTest('Database Connection', true);
      return true;
    } else {
      logTest('Database Connection', false, 'Health check failed');
      return false;
    }
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

async function testSocketConnection() {
  return new Promise((resolve) => {
    console.log('🔌 Testing Socket.IO connection...');
    
    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });
    
    const timeout = setTimeout(() => {
      socket.disconnect();
      logTest('Socket.IO Connection', false, 'Connection timeout');
      resolve(false);
    }, TEST_TIMEOUT);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      logTest('Socket.IO Connection', true);
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      logTest('Socket.IO Connection', false, error.message);
      resolve(false);
    });
  });
}

async function testAnalyticsEndpoints() {
  try {
    console.log('📊 Testing analytics endpoints...');
    
    // Test metrics endpoint
    const metricsResponse = await axios.get(`${BASE_URL}/api/analytics/metrics`, { timeout: 5000 });
    logTest('Analytics Metrics Endpoint', metricsResponse.status === 200);
    
    // Test alerts endpoint
    const alertsResponse = await axios.get(`${BASE_URL}/api/analytics/alerts`, { timeout: 5000 });
    logTest('Analytics Alerts Endpoint', alertsResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Analytics Endpoints', false, error.message);
    return false;
  }
}

async function testGeofenceEndpoints() {
  try {
    console.log('📍 Testing geofence endpoints...');
    
    // Test get geofences
    const getResponse = await axios.get(`${BASE_URL}/api/geofences`, { timeout: 5000 });
    logTest('Get Geofences Endpoint', getResponse.status === 200);
    
    // Test create geofence
    const testGeofence = {
      name: 'Test Zone',
      type: 'test',
      center: { lat: 40.7128, lng: -74.0060 },
      radius: 100
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/geofences`, testGeofence, { timeout: 5000 });
    logTest('Create Geofence Endpoint', createResponse.status === 201 || createResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Geofence Endpoints', false, error.message);
    return false;
  }
}

async function testRealTimeEvents() {
  return new Promise((resolve) => {
    console.log('📡 Testing real-time events...');
    
    const socket = io(BASE_URL, {
      transports: ['websocket'],
      timeout: 5000
    });
    
    let eventsReceived = 0;
    const expectedEvents = ['connect', 'dashboard:metrics'];
    
    const timeout = setTimeout(() => {
      socket.disconnect();
      logTest('Real-Time Events', eventsReceived > 0, `Received ${eventsReceived} events`);
      resolve(eventsReceived > 0);
    }, TEST_TIMEOUT);
    
    socket.on('connect', () => {
      eventsReceived++;
      // Emit a test event
      socket.emit('test:ping', { message: 'test' });
    });
    
    socket.on('dashboard:metrics', (data) => {
      eventsReceived++;
      logTest('Dashboard Metrics Event', true);
    });
    
    socket.on('test:pong', (data) => {
      eventsReceived++;
      logTest('Test Event Echo', true);
    });
    
    socket.on('disconnect', () => {
      clearTimeout(timeout);
    });
  });
}

async function testLocationTracking() {
  try {
    console.log('📍 Testing location tracking...');
    
    const testLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      timestamp: new Date().toISOString()
    };
    
    const response = await axios.post(`${BASE_URL}/api/location/update`, testLocation, { timeout: 5000 });
    logTest('Location Update Endpoint', response.status === 200);
    
    return true;
  } catch (error) {
    logTest('Location Tracking', false, error.message);
    return false;
  }
}

async function testCommunicationFeatures() {
  try {
    console.log('💬 Testing communication features...');
    
    // Test message sending
    const testMessage = {
      senderId: 'test-user',
      receiverId: 'test-driver',
      message: 'Test message',
      rideId: 'test-ride'
    };
    
    const response = await axios.post(`${BASE_URL}/api/messages/send`, testMessage, { timeout: 5000 });
    logTest('Message Sending', response.status === 200 || response.status === 201);
    
    return true;
  } catch (error) {
    logTest('Communication Features', false, error.message);
    return false;
  }
}

async function testPerformanceMonitoring() {
  try {
    console.log('📈 Testing performance monitoring...');
    
    const response = await axios.get(`${BASE_URL}/api/performance/metrics`, { timeout: 5000 });
    logTest('Performance Metrics Endpoint', response.status === 200);
    
    return true;
  } catch (error) {
    logTest('Performance Monitoring', false, error.message);
    return false;
  }
}

async function testSystemHealth() {
  try {
    console.log('🏥 Testing system health...');
    
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      const health = response.data;
      logTest('System Health Endpoint', true);
      logTest('System Status', health.status === 'healthy', `Status: ${health.status}`);
      
      if (health.metrics) {
        logTest('Health Metrics', true, `CPU: ${health.metrics.cpu}%, Memory: ${health.metrics.memory}%`);
      }
    } else {
      logTest('System Health', false, 'Health check failed');
    }
    
    return true;
  } catch (error) {
    logTest('System Health', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Real-Time Features Test Suite\n');
  
  // Test database and basic connectivity
  await testDatabaseConnection();
  await testSocketConnection();
  
  // Test API endpoints
  await testAnalyticsEndpoints();
  await testGeofenceEndpoints();
  await testLocationTracking();
  await testCommunicationFeatures();
  await testPerformanceMonitoring();
  await testSystemHealth();
  
  // Test real-time events
  await testRealTimeEvents();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  Passed: ${testResults.passed}`);
  console.log(`  Failed: ${testResults.failed}`);
  console.log(`  Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Real-time features are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
  
  return testResults.failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testDatabaseConnection,
  testSocketConnection,
  testAnalyticsEndpoints,
  testGeofenceEndpoints,
  testRealTimeEvents,
  testLocationTracking,
  testCommunicationFeatures,
  testPerformanceMonitoring,
  testSystemHealth
}; 