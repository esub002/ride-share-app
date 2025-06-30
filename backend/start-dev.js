#!/usr/bin/env node

// Development startup script for the backend
// This script sets up the environment and starts the server

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Ride Share Backend in Development Mode...\n');

// Set environment variables for development
process.env.NODE_ENV = 'development';
process.env.PORT = '3000'; // Server will automatically find available port if 3000 is busy
process.env.JWT_SECRET = 'ride_share_dev_secret_2024';

// Optional: Set to 'true' to use real PostgreSQL instead of mock database
// process.env.USE_REAL_DB = 'true';

console.log('📋 Environment Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT} (will auto-find available port if busy)`);
console.log(`   Database: ${process.env.USE_REAL_DB ? 'PostgreSQL' : 'Mock Database'}`);
console.log('');

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
}); 