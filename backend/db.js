// db.js - PostgreSQL connection pool setup with mock fallback
// Used throughout the backend for database queries

// backend/db.js
const { Pool } = require('pg');

// Mock database for development when PostgreSQL is not available
class MockDatabase {
  constructor() {
    this.data = {
      users: [
        { id: 1, name: 'Test User', email: 'user@test.com', phone: '+1234567890', verified: true, password: '$2b$10$mock.hash' },
        { id: 2, name: 'John Driver', email: 'driver@test.com', phone: '+1234567891', car_info: 'Toyota Prius', verified: true, password: '$2b$10$mock.hash' }
      ],
      drivers: [
        { id: 1, name: 'John Driver', email: 'driver@test.com', phone: '+1234567891', car_info: 'Toyota Prius', verified: true, available: true, latitude: 37.7749, longitude: -122.4194 }
      ],
      rides: [
        { id: 1, user_id: 1, driver_id: 1, pickup: '123 Main St', destination: '456 Oak Ave', status: 'completed', fare: 25.50, created_at: new Date() }
      ],
      earnings: [
        { driver_id: 1, amount: 125.50, period: 'today', date: new Date() },
        { driver_id: 1, amount: 847.25, period: 'week', date: new Date() },
        { driver_id: 1, amount: 3240.75, period: 'month', date: new Date() }
      ]
    };
  }

  async query(text, params = []) {
    console.log(`🔍 Mock DB Query: ${text}`, params);
    
    // Simple query parsing for common operations
    if (text.includes('SELECT')) {
      if (text.includes('users')) {
        return { rows: this.data.users, rowCount: this.data.users.length };
      }
      if (text.includes('drivers')) {
        return { rows: this.data.drivers, rowCount: this.data.drivers.length };
      }
      if (text.includes('rides')) {
        return { rows: this.data.rides, rowCount: this.data.rides.length };
      }
      if (text.includes('earnings')) {
        return { rows: this.data.earnings, rowCount: this.data.earnings.length };
      }
      if (text.includes('NOW()')) {
        return { rows: [{ now: new Date() }], rowCount: 1 };
      }
    }
    
    if (text.includes('INSERT')) {
      // Mock insert operations
      const newId = Math.max(...this.data.users.map(u => u.id), ...this.data.drivers.map(d => d.id), ...this.data.rides.map(r => r.id)) + 1;
      return { rows: [{ id: newId }], rowCount: 1 };
    }
    
    if (text.includes('UPDATE')) {
      // Mock update operations
      return { rows: [], rowCount: 1 };
    }
    
    // Default response
    return { rows: [], rowCount: 0 };
  }

  async connect() {
    console.log('🔗 Mock database connected');
    return this;
  }

  async end() {
    console.log('🔗 Mock database disconnected');
  }
}

let pool;

// Use mock database by default in development to avoid PostgreSQL connection issues
if (process.env.NODE_ENV === 'development' && !process.env.USE_REAL_DB) {
  console.log('🔄 Development mode: Using mock database');
  pool = new MockDatabase();
} else {
  try {
    // Try to create a real PostgreSQL connection
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'ride_share',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    });

    // Test the connection
    pool.query('SELECT NOW() as test')
      .then(() => {
        console.log('✅ PostgreSQL connected successfully');
      })
      .catch((err) => {
        console.log('❌ PostgreSQL connection failed, using mock database');
        console.log('   Error:', err.message);
        pool = new MockDatabase();
      });

  } catch (error) {
    console.log('❌ PostgreSQL pool creation failed, using mock database');
    console.log('   Error:', error.message);
    pool = new MockDatabase();
  }
}

module.exports = pool;