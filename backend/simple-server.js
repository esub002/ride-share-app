const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Mock data for driver app testing
const mockDrivers = [
  {
    id: 1,
    name: 'John Driver',
    email: 'driver@test.com',
    phone: '+1234567891',
    car_info: 'Toyota Prius 2020',
    verified: true,
    available: true
  }
];

const mockRides = [
  {
    id: 1,
    pickup: '123 Main St, Downtown',
    destination: '456 Oak Ave, Uptown',
    fare: 25.50,
    status: 'requested',
    created_at: new Date()
  }
];

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ride Share API is working!',
    timestamp: new Date().toISOString(),
    mode: 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'mock'
  });
});

// Driver authentication endpoints
app.post('/api/auth/driver/send-otp', (req, res) => {
  const { phone } = req.body;
  console.log('📱 OTP requested for:', phone);
  res.json({ 
    success: true, 
    message: 'OTP sent successfully',
    otp: '123456' // For testing
  });
});

app.post('/api/auth/driver/verify-otp', (req, res) => {
  const { phone, otp, name, car_info } = req.body;
  console.log('🔐 OTP verification for:', phone, 'OTP:', otp);
  
  if (otp === '123456') {
    const driver = mockDrivers.find(d => d.phone === phone) || {
      id: mockDrivers.length + 1,
      name: name || 'New Driver',
      phone,
      car_info: car_info || 'Vehicle',
      email: `${phone}@driver.com`,
      verified: true
    };
    
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      driver
    });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Driver profile endpoints
app.get('/api/drivers/profile', (req, res) => {
  res.json(mockDrivers[0]);
});

app.post('/api/drivers/location', (req, res) => {
  const { latitude, longitude } = req.body;
  console.log('📍 Driver location update:', { latitude, longitude });
  res.json({ success: true });
});

app.patch('/api/drivers/availability', (req, res) => {
  const { available } = req.body;
  console.log('🚗 Driver availability:', available);
  res.json({ success: true });
});

// Ride endpoints
app.get('/api/rides', (req, res) => {
  const { status } = req.query;
  if (status === 'requested') {
    res.json(mockRides);
  } else {
    res.json([]);
  }
});

app.post('/api/rides/:id/accept', (req, res) => {
  const { id } = req.params;
  console.log('✅ Ride accepted:', id);
  res.json({ success: true });
});

app.post('/api/rides/:id/reject', (req, res) => {
  const { id } = req.params;
  console.log('❌ Ride rejected:', id);
  res.json({ success: true });
});

app.post('/api/rides/:id/complete', (req, res) => {
  const { id } = req.params;
  console.log('✅ Ride completed:', id);
  res.json({ success: true });
});

// Earnings endpoints
app.get('/api/drivers/earnings', (req, res) => {
  res.json({
    today: 125.50,
    week: 847.25,
    month: 3240.75,
    total: 15420.50
  });
});

app.get('/api/drivers/stats', (req, res) => {
  res.json({
    totalRides: 1250,
    totalEarnings: 15420.50,
    rating: 4.8,
    onlineHours: 8.5,
    acceptanceRate: 95.2
  });
});

// Current ride endpoint
app.get('/api/drivers/current-ride', (req, res) => {
  res.json(null); // No current ride
});

// Available rides endpoint
app.get('/api/rides', (req, res) => {
  res.json(mockRides);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API test: http://localhost:${PORT}/api/auth/driver/send-otp`);
  console.log(`🌐 Environment: development`);
}); 