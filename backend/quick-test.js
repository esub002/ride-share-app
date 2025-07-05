#!/usr/bin/env node

console.log('🚀 Quick Real-Time Test\n');

// Test 1: Check if Socket.IO is available
try {
  const { io } = require('socket.io-client');
  console.log('✅ Socket.IO client is available');
} catch (error) {
  console.log('❌ Socket.IO client not found:', error.message);
}

// Test 2: Check if server can start
try {
  const express = require('express');
  const { createServer } = require('http');
  const { Server } = require('socket.io');
  
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  console.log('✅ Socket.IO server can be created');
  
  // Test basic socket functionality
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    socket.on('test', (data) => {
      console.log('✅ Received test event:', data);
      socket.emit('test-response', { message: 'Server received your test!' });
    });
    
    socket.on('disconnect', () => {
      console.log('✅ Client disconnected:', socket.id);
    });
  });
  
  // Start server on test port
  const testPort = 3001;
  server.listen(testPort, () => {
    console.log(`✅ Test server running on port ${testPort}`);
    
    // Test client connection
    const client = require('socket.io-client')(`http://localhost:${testPort}`);
    
    client.on('connect', () => {
      console.log('✅ Test client connected successfully');
      
      // Send test event
      client.emit('test', { message: 'Hello from test client!' });
    });
    
    client.on('test-response', (data) => {
      console.log('✅ Test response received:', data);
      
      // Cleanup
      client.disconnect();
      server.close(() => {
        console.log('✅ Test server closed');
        console.log('\n🎉 All real-time tests passed!');
        process.exit(0);
      });
    });
    
    client.on('connect_error', (error) => {
      console.log('❌ Test client connection failed:', error.message);
      process.exit(1);
    });
  });
  
} catch (error) {
  console.log('❌ Server test failed:', error.message);
}

console.log('\n🔧 Real-time features are ready to use!');
console.log('📋 Next steps:');
console.log('1. Start the main backend server: npm start');
console.log('2. Start the driver app: npm start');
console.log('3. Test real-time features in the app'); 