const { Pool } = require('pg');

async function createTestDriver() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ride_share',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');

    // Check if test driver already exists
    const existingDriver = await pool.query(
      'SELECT * FROM drivers WHERE email = $1',
      ['demo@driver.com']
    );

    if (existingDriver.rows.length > 0) {
      console.log('✅ Test driver already exists:', existingDriver.rows[0]);
      return existingDriver.rows[0];
    }

    // Create test driver
    const result = await pool.query(
      'INSERT INTO drivers (name, email, car_info, available, verified) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['Demo Driver', 'demo@driver.com', 'Toyota Prius 2020', false, true]
    );

    console.log('✅ Test driver created:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error creating test driver:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTestDriver()
    .then(() => {
      console.log('🎉 Test driver setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test driver setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestDriver };
