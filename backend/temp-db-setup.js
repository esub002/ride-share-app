const { Pool } = require('pg');

console.log('🔧 Temporary Database Setup\n');

// Try to connect with different methods and create a new user
async function setupDatabase() {
  console.log('📡 Attempting to connect to PostgreSQL...\n');
  
  // Method 1: Try with empty password (some installations allow this)
  try {
    console.log('🔓 Trying connection with empty password...');
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: null, // Try null instead of empty string
      port: 5432,
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log(`   ✅ SUCCESS! Connected with empty password`);
    console.log(`   📅 Connected at: ${result.rows[0].current_time}`);
    
    // Create a new user for our application
    console.log('\n👤 Creating new database user...');
    await pool.query(`
      CREATE USER ride_share_user WITH PASSWORD 'ride_share_pass';
    `);
    console.log('   ✅ Created user: ride_share_user');
    
    // Create database if it doesn't exist
    console.log('\n🗄️ Creating database...');
    await pool.query(`
      CREATE DATABASE ride_share OWNER ride_share_user;
    `);
    console.log('   ✅ Created database: ride_share');
    
    // Grant privileges
    await pool.query(`
      GRANT ALL PRIVILEGES ON DATABASE ride_share TO ride_share_user;
    `);
    console.log('   ✅ Granted privileges to ride_share_user');
    
    await pool.end();
    
    // Create .env file with new credentials
    const envContent = `# Database Configuration
DB_USER=ride_share_user
DB_HOST=localhost
DB_NAME=ride_share
DB_PASSWORD=ride_share_pass
DB_PORT=5432

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
`;
    
    require('fs').writeFileSync('.env', envContent);
    console.log('\n✅ Created .env file with new credentials');
    
    console.log('\n🎉 Database setup completed!');
    console.log('📊 New credentials:');
    console.log('   User: ride_share_user');
    console.log('   Password: ride_share_pass');
    console.log('   Database: ride_share');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Test connection: node test-db-connection.js');
    console.log('2. Setup analytics: node scripts/setup-analytics.js');
    console.log('3. Start server: npm start');
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Method 2: Try to find PostgreSQL installation and reset password
  console.log('\n🔧 Alternative: Manual PostgreSQL Password Reset');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Find your PostgreSQL installation:');
  console.log('   - Usually in C:\\Program Files\\PostgreSQL\\[version]\\');
  console.log('   - Or check Windows Services for PostgreSQL');
  console.log('');
  console.log('2. Open Command Prompt as Administrator');
  console.log('3. Navigate to PostgreSQL bin directory:');
  console.log('   cd "C:\\Program Files\\PostgreSQL\\[version]\\bin"');
  console.log('4. Connect to PostgreSQL:');
  console.log('   psql -U postgres');
  console.log('5. If that works, set a new password:');
  console.log('   ALTER USER postgres PASSWORD \'postgres\';');
  console.log('6. Exit: \\q');
  console.log('');
  console.log('3. Alternative: Use pgAdmin GUI tool');
  console.log('   - Download from: https://www.pgadmin.org/download/');
  console.log('   - Connect and reset password through GUI');
  console.log('');
  console.log('4. Last resort: Reinstall PostgreSQL');
  console.log('   - Uninstall current PostgreSQL');
  console.log('   - Download from: https://www.postgresql.org/download/windows/');
  console.log('   - Install with password: postgres');
  
  return false;
}

// Run the setup
setupDatabase().catch(console.error); 