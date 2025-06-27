const { exec } = require('child_process');
const fs = require('fs');

console.log('🔧 PostgreSQL Password Fix Helper\n');

console.log('📋 The issue is that your PostgreSQL password is not "postgres"');
console.log('Here are the solutions:\n');

console.log('🎯 Solution 1: Reset PostgreSQL Password');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Open Command Prompt as Administrator');
console.log('2. Connect to PostgreSQL as superuser:');
console.log('   psql -U postgres');
console.log('3. If that fails, try:');
console.log('   psql -U postgres -h localhost');
console.log('4. Once connected, set a new password:');
console.log('   ALTER USER postgres PASSWORD \'postgres\';');
console.log('5. Exit: \\q');
console.log('');

console.log('🎯 Solution 2: Use Your Current Password');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Find out your current PostgreSQL password');
console.log('2. Update the .env file with your actual password');
console.log('3. Or set environment variable:');
console.log('   set DB_PASSWORD=your_actual_password');
console.log('');

console.log('🎯 Solution 3: Create a New User');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Connect to PostgreSQL (find your password first)');
console.log('2. Create a new user:');
console.log('   CREATE USER ride_share_user WITH PASSWORD \'ride_share_pass\';');
console.log('3. Grant privileges:');
console.log('   GRANT ALL PRIVILEGES ON DATABASE ride_share TO ride_share_user;');
console.log('4. Update .env file with new credentials');
console.log('');

console.log('🎯 Solution 4: Use Docker (Recommended)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Start Docker Desktop');
console.log('2. Run: docker run --name postgres-ride-share \\');
console.log('   -e POSTGRES_PASSWORD=postgres \\');
console.log('   -e POSTGRES_DB=ride_share \\');
console.log('   -p 5432:5432 -d postgres:15');
console.log('3. This will create a fresh PostgreSQL instance');
console.log('');

console.log('🔍 Quick Diagnostic Commands:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('• Check if PostgreSQL is running:');
console.log('  netstat -an | findstr 5432');
console.log('');
console.log('• Try connecting with different methods:');
console.log('  psql -U postgres');
console.log('  psql -U postgres -h localhost');
console.log('  psql -U postgres -d postgres');
console.log('');

console.log('📝 Current .env Configuration:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const envPath = '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(envContent);
} else {
  console.log('No .env file found. Creating one...');
  const envContent = `# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ride_share
DB_PASSWORD=postgres
DB_PORT=5432

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
}

console.log('\n🚀 Next Steps:');
console.log('1. Choose one of the solutions above');
console.log('2. Fix the password issue');
console.log('3. Test connection: node test-db-connection.js');
console.log('4. Run analytics setup: node scripts/setup-analytics.js'); 