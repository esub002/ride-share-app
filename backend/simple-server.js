const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Backend is running!'
  });
});

// Basic API endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Ride Share API is working',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    data: {
      users: 2,
      drivers: 1,
      rides: 1
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Simple server running on port ${port}`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`📋 API Test: http://localhost:${port}/api/test`);
});

module.exports = app; 