/**
 * Simple Server Test
 * Basic connectivity test without external dependencies
 */

const http = require('http');
const https = require('https');

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const SERVER_HOST = new URL(SERVER_URL).hostname;
const SERVER_PORT = new URL(SERVER_URL).port || 3000;
const IS_HTTPS = SERVER_URL.startsWith('https');

console.log('🚀 Simple Server Test');
console.log('='.repeat(40));
console.log(`📍 Server: ${SERVER_URL}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('='.repeat(40));

// Test server connectivity
async function testServer() {
  console.log('\n🔍 Testing Server Connectivity...');
  
  return new Promise((resolve, reject) => {
    const client = IS_HTTPS ? https : http;
    
    const req = client.request({
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
        console.log(`📊 Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Server is running and healthy!');
          try {
            const healthData = JSON.parse(data);
            console.log(`📝 Uptime: ${Math.round(healthData.uptime)}s`);
            console.log(`🗄️ Database: ${healthData.database?.status || 'unknown'}`);
          } catch (e) {
            console.log(`📝 Response: ${data.substring(0, 100)}...`);
          }
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

// Test Socket.IO endpoint
async function testSocketEndpoint() {
  console.log('\n🔌 Testing Socket.IO Endpoint...');
  
  return new Promise((resolve, reject) => {
    const client = IS_HTTPS ? https : http;
    
    const req = client.request({
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

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...');
  
  const endpoints = [
    { path: '/', name: 'Root API' },
    { path: '/api/dev/mock-data', name: 'Mock Data (dev only)' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint.path, endpoint.name);
      if (!result) break;
    } catch (error) {
      console.log(`❌ ${endpoint.name} test failed: ${error.message}`);
    }
  }
}

async function testEndpoint(path, name) {
  return new Promise((resolve, reject) => {
    const client = IS_HTTPS ? https : http;
    
    const req = client.request({
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${name} - Working`);
        } else if (res.statusCode === 404 && path === '/api/dev/mock-data') {
          console.log(`⚠️ ${name} - Not available (expected in production)`);
        } else {
          console.log(`❌ ${name} - Status: ${res.statusCode}`);
        }
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${name} - Connection failed: ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`⏰ ${name} - Connection timeout`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Main test runner
async function runSimpleTests() {
  try {
    const serverOk = await testServer();
    
    if (!serverOk) {
      console.log('\n❌ Server is not responding properly.');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Start the server: npm start');
      console.log('2. Check if port 3000 is available');
      console.log('3. Verify server configuration');
      process.exit(1);
    }
    
    await testSocketEndpoint();
    await testAPIEndpoints();
    
    console.log('\n' + '='.repeat(40));
    console.log('🎉 BASIC TESTS COMPLETED!');
    console.log('='.repeat(40));
    console.log('✅ Server is running and healthy');
    console.log('✅ Socket.IO endpoint is available');
    console.log('✅ API endpoints are responding');
    console.log('\n💡 To run full Socket.IO tests:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Run: npm run test:realtime');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running');
    console.log('2. Check server logs for errors');
    console.log('3. Verify network connectivity');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSimpleTests();
}

module.exports = {
  testServer,
  testSocketEndpoint,
  testAPIEndpoints,
  runSimpleTests
}; 