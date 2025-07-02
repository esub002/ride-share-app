const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

async function testEnhancedRideRequest() {
  console.log('🚗 Testing Enhanced Ride Request Modal...');
  
  // Connect to the server
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Connected to server');
    
    // Emit a test ride request event with enhanced data
    const enhancedRideRequest = {
      id: 'enhanced-test-' + Date.now(),
      riderName: 'John Smith',
      pickup: '123 Main Street, Downtown',
      destination: '456 Oak Avenue, Uptown',
      pickupLocation: {
        latitude: 37.78825,
        longitude: -122.4324
      },
      dropoffLocation: {
        latitude: 37.7849,
        longitude: -122.4094
      },
      estimatedFare: 25.50,
      distance: 2.5,
      eta: 8,
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString(),
      riderRating: 4.8,
      specialRequests: 'Quiet ride preferred',
      surgeMultiplier: 1.2
    };

    console.log('📡 Emitting enhanced ride:request event...');
    console.log('📋 Ride Request Details:', enhancedRideRequest);
    
    socket.emit('ride:request', enhancedRideRequest);
    
    // Disconnect after sending
    setTimeout(() => {
      console.log('🔌 Disconnecting from server');
      socket.disconnect();
      process.exit(0);
    }, 2000);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  });
}

testEnhancedRideRequest().catch(console.error); 