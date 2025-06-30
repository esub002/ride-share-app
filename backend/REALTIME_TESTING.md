# Real-time System Testing Guide

This guide covers how to test the real-time Socket.IO features of the ride-share application.

## 🚀 Quick Start

### Prerequisites
1. Make sure the backend server is running
2. Install dependencies: `npm install`
3. Ensure database is connected (optional for basic tests)

### Running Tests

#### Option 1: Run All Tests (Recommended)
```bash
npm run test:realtime
```

This will run both basic connectivity tests and full Socket.IO feature tests.

#### Option 2: Run Tests Separately

**Basic Connectivity Tests:**
```bash
npm run test:realtime:basic
```

**Full Socket.IO Tests:**
```bash
npm run test:realtime:full
```

## 📋 Test Coverage

### Basic Connectivity Tests
- ✅ Server health endpoint
- ✅ Socket.IO endpoint availability
- ✅ Connection establishment

### Socket.IO Feature Tests
- ✅ **Authentication & Connection**
  - Rider connection with JWT
  - Driver connection with JWT
  - Invalid token rejection

- ✅ **Driver Availability**
  - Driver going available/unavailable
  - Status broadcasting to riders

- ✅ **Location Updates**
  - Driver location tracking
  - Rider location updates
  - Real-time location broadcasting

- ✅ **Ride Request Flow**
  - Ride request creation
  - Driver notification
  - Ride acceptance
  - Status updates

- ✅ **Real-time Messaging**
  - Text message exchange
  - Typing indicators
  - Message delivery confirmation

- ✅ **Emergency Alerts**
  - Emergency alert broadcasting
  - Admin notification system
  - Alert categorization

- ✅ **Error Handling**
  - Invalid token rejection
  - Unauthorized action prevention
  - Connection error handling

- ✅ **Connection Statistics**
  - Multiple concurrent connections
  - Heartbeat functionality
  - Connection monitoring

## 🔧 Configuration

### Environment Variables
```bash
# Server URL for testing
TEST_SERVER_URL=http://localhost:3000

# JWT Secret for test tokens
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
```

### Test Users
The test suite uses predefined test users:
- **Rider**: ID 1, role 'user'
- **Driver**: ID 2, role 'driver'  
- **Admin**: ID 3, role 'admin'

## 📊 Test Results

### Success Output
```
🚀 RIDE-SHARE REAL-TIME SYSTEM TEST SUITE
============================================================
📅 Started at: 2024-01-15T10:30:00.000Z
🌍 Environment: development
============================================================

📋 STEP 1: Basic Server Connectivity Tests
--------------------------------------------------
🔍 Testing Server Connectivity...
📍 Server: http://localhost:3000
✅ Server is running and responding
📊 Status: 200
📝 Response: {"status":"healthy","timestamp":"2024-01-15T10:30:01.000Z",...}

🔌 Testing Socket.IO Endpoint...
✅ Socket.IO endpoint is available
📊 Status: 400 (Expected for WebSocket upgrade)

============================================================
📋 BASIC TEST RESULTS
============================================================
✅ All basic tests passed! Server is ready for Socket.IO tests.

📋 STEP 2: Socket.IO Real-time Feature Tests
--------------------------------------------------
🔌 Testing Connection and Authentication...
✅ Rider Connection - PASSED
✅ Driver Connection - PASSED

🚗 Testing Driver Availability...
✅ Driver Available Status - PASSED
✅ Driver Unavailable Status - PASSED

📍 Testing Location Updates...
✅ Driver Location Update - PASSED
✅ Rider Location Update - PASSED

🚕 Testing Ride Request Flow...
✅ Ride Request Flow - PASSED

💬 Testing Real-time Messaging...
✅ Real-time Messaging - PASSED

🚨 Testing Emergency Alerts...
✅ Emergency Alerts - PASSED

⚠️ Testing Error Handling...
✅ Invalid Token Rejection - PASSED
✅ Unauthorized Action Rejection - PASSED

📊 Testing Connection Statistics...
✅ Heartbeat Functionality - PASSED
✅ Multiple Connections - PASSED

============================================================
📋 TEST RESULTS SUMMARY
============================================================
✅ Passed: 15
❌ Failed: 0
📊 Total: 15

🎉 All tests passed! Real-time system is working correctly.

============================================================
🎉 ALL TEST SUITES COMPLETED SUCCESSFULLY!
============================================================
✅ Real-time system is fully operational
✅ All Socket.IO features are working correctly
✅ Authentication and security are properly configured
✅ Error handling and edge cases are covered

🚀 Your ride-share app is ready for real-time features!
```

### Failure Output
```
❌ Some tests failed. Check the details above.

📝 Detailed Results:
❌ Rider Connection - FAILED: Connection timeout
✅ Driver Connection - PASSED
❌ Driver Available Status - FAILED: No response received
...
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Server Not Running
```
❌ Server connection failed
📝 Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution:** Start the server with `npm start`

#### 2. Database Connection Issues
```
⚠️ Server responded with status: 503
📝 Response: {"status":"unhealthy","error":"Database connection failed"}
```
**Solution:** Check database configuration and connection

#### 3. Socket.IO Connection Timeout
```
❌ Rider Connection - FAILED: Connection timeout
```
**Solution:** 
- Check if Socket.IO is properly initialized
- Verify CORS configuration
- Check firewall settings

#### 4. Authentication Errors
```
❌ Invalid Token Rejection - FAILED: Should not connect with invalid token
```
**Solution:** Check JWT configuration and middleware setup

### Debug Mode

To run tests with more verbose output, set the DEBUG environment variable:
```bash
DEBUG=socket.io* npm run test:realtime
```

### Manual Testing

You can also test individual features manually using the test client:

```javascript
const { testConnection } = require('./test-socket-client');

// Test only connection
testConnection().then(() => {
  console.log('Connection test completed');
});
```

## 📈 Performance Testing

For performance testing, you can modify the test scripts to:
- Increase the number of concurrent connections
- Test message throughput
- Monitor memory usage
- Test reconnection scenarios

## 🔒 Security Testing

The test suite includes security tests:
- JWT token validation
- Role-based access control
- Unauthorized action prevention
- Input sanitization

## 📝 Adding New Tests

To add new tests, modify the appropriate test file:

1. **Basic tests**: `test-server-basic.js`
2. **Socket.IO tests**: `test-socket-client.js`
3. **Integration tests**: Create new test files

### Test Structure
```javascript
async function testNewFeature() {
  console.log('\n🔧 Testing New Feature...');
  
  try {
    // Test implementation
    const result = await someTest();
    
    logTest('New Feature Test', result);
  } catch (error) {
    logTest('New Feature Test', false, error.message);
  }
}
```

## 🚀 Next Steps

After successful testing:
1. Deploy to staging environment
2. Run load tests
3. Monitor performance metrics
4. Set up automated testing in CI/CD
5. Implement production monitoring

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs
3. Verify environment configuration
4. Test with a minimal setup
5. Contact the development team 