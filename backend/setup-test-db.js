const { Pool } = require('pg');

console.log('🔧 Setting up Test Database Schema...\n');

// Create a mock pool for testing
const createMockPool = () => {
  return {
    query: jest.fn().mockImplementation((sql, params) => {
      // Mock responses for common queries
      if (sql.includes('SELECT NOW()')) {
        return Promise.resolve({ rows: [{ now: new Date() }] });
      }
      if (sql.includes('SELECT 1 FROM users WHERE email')) {
        return Promise.resolve({ rows: [] }); // No existing user
      }
      if (sql.includes('SELECT * FROM users WHERE email')) {
        return Promise.resolve({ 
          rows: [{ 
            id: 1, 
            email: 'test@example.com', 
            password: '$2b$10$test', 
            verified: true 
          }] 
        });
      }
      if (sql.includes('INSERT INTO users')) {
        return Promise.resolve({ 
          rows: [{ id: 1, name: 'Test User', email: 'test@example.com' }] 
        });
      }
      if (sql.includes('UPDATE users SET verified')) {
        return Promise.resolve({ rowCount: 1 });
      }
      if (sql.includes('UPDATE drivers SET verified')) {
        return Promise.resolve({ rowCount: 1 });
      }
      if (sql.includes('SELECT id FROM drivers')) {
        return Promise.resolve({ rows: [{ id: 1 }] });
      }
      if (sql.includes('SELECT id FROM users')) {
        return Promise.resolve({ rows: [{ id: 1 }] });
      }
      if (sql.includes('INSERT INTO safety_alerts')) {
        return Promise.resolve({ 
          rows: [{ id: 1, driver_id: 1, alert_type: 'test' }] 
        });
      }
      if (sql.includes('INSERT INTO safety_checkins')) {
        return Promise.resolve({ 
          rows: [{ id: 1, driver_id: 1, status: 'safe' }] 
        });
      }
      if (sql.includes('SELECT * FROM safety_alerts')) {
        return Promise.resolve({ 
          rows: [{ id: 1, driver_id: 1, alert_type: 'test', timestamp: new Date() }] 
        });
      }
      
      // Default response
      return Promise.resolve({ rows: [], rowCount: 0 });
    })
  };
};

// Create the actual database schema if connection is available
const setupRealDatabase = async () => {
  try {
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'ride_share',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    });

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to real database');

    // Create tables if they don't exist
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Drivers table
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        car_info TEXT,
        verified BOOLEAN DEFAULT FALSE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        available BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Rides table
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        driver_id INTEGER REFERENCES drivers(id),
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'requested',
        fare DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Safety alerts table
      CREATE TABLE IF NOT EXISTS safety_alerts (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER REFERENCES drivers(id),
        alert_type VARCHAR(100) NOT NULL,
        location JSONB,
        notes TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );

      -- Safety checkins table
      CREATE TABLE IF NOT EXISTS safety_checkins (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER REFERENCES drivers(id),
        location JSONB,
        status VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `;

    await pool.query(createTablesSQL);
    console.log('✅ Database tables created successfully');
    
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ Real database setup failed:', error.message);
    console.log('📝 Using mock database for tests');
    return false;
  }
};

// Main setup function
const setupDatabase = async () => {
  console.log('🚀 Starting database setup...\n');
  
  // Try to set up real database first
  const realDbSuccess = await setupRealDatabase();
  
  if (!realDbSuccess) {
    console.log('🔧 Creating mock database for testing...');
    
    // Export mock pool for tests
    module.exports = {
      createMockPool,
      isMock: true
    };
  } else {
    console.log('✅ Real database setup completed');
    module.exports = {
      createMockPool: null,
      isMock: false
    };
  }
  
  console.log('\n🎉 Database setup completed!');
  console.log('📊 Next steps:');
  console.log('1. Run tests: npm test');
  console.log('2. Start server: npm start');
  console.log('3. Check API docs: http://localhost:3000/api-docs');
};

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase, createMockPool }; 