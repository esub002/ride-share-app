const { Pool } = require('pg');

// Test database connection with different configurations
async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  // Test configurations
  const configs = [
    {
      name: 'Default Configuration',
      config: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'ride_share',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      }
    },
    {
      name: 'PostgreSQL Default',
      config: {
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: 'postgres',
        port: 5432,
      }
    },
    {
      name: 'No Password (Trust Auth)',
      config: {
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        port: 5432,
      }
    }
  ];

  for (const testConfig of configs) {
    console.log(`📡 Testing: ${testConfig.name}`);
    console.log(`   Host: ${testConfig.config.host}:${testConfig.config.port}`);
    console.log(`   User: ${testConfig.config.user}`);
    console.log(`   Database: ${testConfig.config.database}`);
    
    try {
      const pool = new Pool(testConfig.config);
      
      // Test connection
      const result = await pool.query('SELECT NOW() as current_time, version() as version');
      
      console.log(`   ✅ SUCCESS: Connected to PostgreSQL`);
      console.log(`   📅 Current Time: ${result.rows[0].current_time}`);
      console.log(`   🐘 Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      
      // Test if ride_share database exists
      try {
        const dbResult = await pool.query("SELECT datname FROM pg_database WHERE datname = 'ride_share'");
        if (dbResult.rows.length > 0) {
          console.log(`   🗄️ Database 'ride_share' exists`);
        } else {
          console.log(`   ⚠️ Database 'ride_share' does not exist`);
        }
      } catch (dbError) {
        console.log(`   ⚠️ Could not check for 'ride_share' database: ${dbError.message}`);
      }
      
      await pool.end();
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      console.log(`   💡 Error Code: ${error.code}`);
      console.log('');
    }
  }

  console.log('🔧 Troubleshooting Steps:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Check if PostgreSQL is running:');
  console.log('   - Windows: Check Services app for "PostgreSQL"');
  console.log('   - Linux/Mac: sudo systemctl status postgresql');
  console.log('');
  console.log('2. Verify PostgreSQL installation:');
  console.log('   - Windows: Check if PostgreSQL is installed');
  console.log('   - Linux: sudo apt-get install postgresql postgresql-contrib');
  console.log('   - Mac: brew install postgresql');
  console.log('');
  console.log('3. Start PostgreSQL service:');
  console.log('   - Windows: Start PostgreSQL service in Services');
  console.log('   - Linux: sudo systemctl start postgresql');
  console.log('   - Mac: brew services start postgresql');
  console.log('');
  console.log('4. Set up environment variables:');
  console.log('   Create a .env file in the backend directory:');
  console.log('   DB_USER=postgres');
  console.log('   DB_HOST=localhost');
  console.log('   DB_NAME=ride_share');
  console.log('   DB_PASSWORD=your_password');
  console.log('   DB_PORT=5432');
  console.log('');
  console.log('5. Create database if it doesn\'t exist:');
  console.log('   psql -U postgres -c "CREATE DATABASE ride_share;"');
  console.log('');
  console.log('6. Alternative: Use Docker for PostgreSQL:');
  console.log('   docker run --name postgres-ride-share -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ride_share -p 5432:5432 -d postgres');
}

// Run the test
testDatabaseConnection().catch(console.error); 