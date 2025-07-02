const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

async function testRideRequest() {
  console.log('🚗 Testing real-time ride request reception...');
  
  // Connect to the server
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Connected to server');
    
    // Emit a test ride request event
    const testRideRequest = {
      rideId: 'test-123',
      riderId: 1,
      pickup: '123 Main St, Downtown',
      destination: '456 Oak Ave, Uptown',
      estimatedFare: 25.50,
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString()
    };

    console.log('📡 Emitting ride:request event...');
    socket.emit('ride:request', testRideRequest);
    
    // Also emit to the global namespace for testing
    socket.emit('ride:requested', {
      ride: {
        id: 'test-123',
        rider_id: 1,
        origin: '123 Main St, Downtown',
        destination: '456 Oak Ave, Uptown',
        status: 'requested',
        created_at: new Date().toISOString()
      },
      driver: {
        id: 1,
        name: 'Test Driver',
        car_info: 'Toyota Camry 2020'
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  // Wait a bit then disconnect
  setTimeout(() => {
    console.log('🏁 Test completed, disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
}

testRideRequest().catch(console.error); 