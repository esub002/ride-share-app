const { Pool } = require('pg');

console.log('🔍 PostgreSQL Password Discovery Tool\n');

// Common PostgreSQL passwords to try
const commonPasswords = [
  'postgres',
  'password',
  'admin',
  'root',
  '',
  '123456',
  'postgresql',
  'user',
  'test'
];

// Test connection with different passwords
async function testPasswords() {
  console.log('🔐 Testing common PostgreSQL passwords...\n');
  
  for (const password of commonPasswords) {
    console.log(`📡 Testing password: "${password}"`);
    
    try {
      const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: password,
        port: 5432,
      });
      
      const result = await pool.query('SELECT NOW() as current_time');
      console.log(`   ✅ SUCCESS! Password is: "${password}"`);
      console.log(`   📅 Connected at: ${result.rows[0].current_time}`);
      
      await pool.end();
      
      // Create .env file with correct password
      const envContent = `# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ride_share
DB_PASSWORD=${password}
DB_PORT=5432

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
`;
      
      require('fs').writeFileSync('.env', envContent);
      console.log(`   ✅ Created .env file with correct password`);
      
      console.log('\n🎉 Password found! You can now:');
      console.log('1. Test connection: node test-db-connection.js');
      console.log('2. Setup analytics: node scripts/setup-analytics.js');
      console.log('3. Start server: npm start');
      
      return password;
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ None of the common passwords worked.');
  console.log('\n🔧 Manual Solutions:');
  console.log('1. Check your PostgreSQL installation folder for password');
  console.log('2. Look in pg_hba.conf file for authentication method');
  console.log('3. Try connecting with pgAdmin or another GUI tool');
  console.log('4. Reinstall PostgreSQL with a known password');
  console.log('5. Use Docker Desktop (start it first)');
  
  return null;
}

// Alternative: Try to connect without password (trust authentication)
async function tryTrustAuth() {
  console.log('\n🔓 Trying trust authentication...');
  
  try {
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      port: 5432,
      // No password - trust authentication
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log(`   ✅ SUCCESS! Trust authentication works`);
    console.log(`   📅 Connected at: ${result.rows[0].current_time}`);
    
    await pool.end();
    
    // Create .env file without password
    const envContent = `# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ride_share
DB_PASSWORD=
DB_PORT=5432

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
`;
    
    require('fs').writeFileSync('.env', envContent);
    console.log(`   ✅ Created .env file without password`);
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Trust authentication failed: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting password discovery...\n');
  
  // First try common passwords
  const foundPassword = await testPasswords();
  
  if (!foundPassword) {
    // If no password worked, try trust authentication
    await tryTrustAuth();
  }
}

// Run the discovery
main().catch(console.error); 