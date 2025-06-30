/**
 * Basic Server Connectivity Test
 * Quick check to ensure the server is running before running full tests
 */

const http = require('http');

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const SERVER_HOST = new URL(SERVER_URL).hostname;
const SERVER_PORT = new URL(SERVER_URL).port || 3000;

async function testServerConnectivity() {
  console.log('🔍 Testing Server Connectivity...');
  console.log(`📍 Server: ${SERVER_URL}`);
  
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Server is running and responding');
          console.log(`📊 Status: ${res.statusCode}`);
          console.log(`📝 Response: ${data}`);
          resolve(true);
        } else {
          console.log(`⚠️ Server responded with status: ${res.statusCode}`);
          console.log(`📝 Response: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Server connection failed');
      console.log(`📝 Error: ${error.message}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Server connection timeout');
      req.destroy();
      reject(new Error('Connection timeout'));
    });
    
    req.end();
  });
}

async function testSocketEndpoint() {
  console.log('\n🔌 Testing Socket.IO Endpoint...');
  
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: '/socket.io/',
      method: 'GET',
      timeout: 5000,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      }
    }, (res) => {
      if (res.statusCode === 400) {
        // Expected for WebSocket upgrade request
        console.log('✅ Socket.IO endpoint is available');
        console.log(`📊 Status: ${res.statusCode} (Expected for WebSocket upgrade)`);
        resolve(true);
      } else {
        console.log(`⚠️ Socket.IO endpoint responded with status: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log('❌ Socket.IO endpoint connection failed');
      console.log(`📝 Error: ${error.message}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Socket.IO endpoint connection timeout');
      req.destroy();
      reject(new Error('Connection timeout'));
    });
    
    req.end();
  });
}

async function runBasicTests() {
  console.log('🚀 Starting Basic Server Connectivity Tests...');
  console.log('='.repeat(50));
  
  try {
    const serverOk = await testServerConnectivity();
    const socketOk = await testSocketEndpoint();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 BASIC TEST RESULTS');
    console.log('='.repeat(50));
    
    if (serverOk && socketOk) {
      console.log('✅ All basic tests passed! Server is ready for Socket.IO tests.');
      console.log('\n💡 You can now run: node test-socket-client.js');
      process.exit(0);
    } else {
      console.log('❌ Some basic tests failed. Please check your server configuration.');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure the server is running: npm start');
      console.log('2. Check if the server is listening on the correct port');
      console.log('3. Verify firewall settings');
      console.log('4. Check server logs for errors');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Start the server: npm start');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify server configuration');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBasicTests();
}

module.exports = {
  testServerConnectivity,
  testSocketEndpoint,
  runBasicTests
}; 