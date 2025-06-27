const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Ride Share Database Setup\n');

// Check if Docker is available
function checkDocker() {
  return new Promise((resolve) => {
    exec('docker --version', (error) => {
      if (error) {
        console.log('❌ Docker not found. Please install Docker first.');
        resolve(false);
      } else {
        console.log('✅ Docker is available');
        resolve(true);
      }
    });
  });
}

// Check if PostgreSQL is running locally
function checkPostgreSQL() {
  return new Promise((resolve) => {
    exec('pg_isready -h localhost -p 5432', (error) => {
      if (error) {
        console.log('❌ PostgreSQL not running locally');
        resolve(false);
      } else {
        console.log('✅ PostgreSQL is running locally');
        resolve(true);
      }
    });
  });
}

// Setup with Docker
async function setupWithDocker() {
  console.log('\n🐳 Setting up PostgreSQL with Docker...');
  
  try {
    // Stop any existing containers
    console.log('🛑 Stopping existing containers...');
    exec('docker-compose down', { cwd: __dirname });
    
    // Start containers
    console.log('🚀 Starting PostgreSQL and pgAdmin...');
    exec('docker-compose up -d', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error starting Docker containers:', error.message);
        return;
      }
      
      console.log('✅ Docker containers started successfully!');
      console.log('\n📊 Database Information:');
      console.log('   Host: localhost');
      console.log('   Port: 5432');
      console.log('   Database: ride_share');
      console.log('   Username: postgres');
      console.log('   Password: postgres');
      console.log('\n🌐 pgAdmin (Database GUI):');
      console.log('   URL: http://localhost:8080');
      console.log('   Email: admin@ride-share.com');
      console.log('   Password: admin');
      
      console.log('\n⏳ Waiting for database to be ready...');
      setTimeout(() => {
        console.log('✅ Database should be ready now!');
        console.log('\n🔧 Next steps:');
        console.log('1. Test connection: node test-db-connection.js');
        console.log('2. Run analytics setup: node scripts/setup-analytics.js');
        console.log('3. Start the server: npm start');
      }, 10000);
    });
    
  } catch (error) {
    console.error('❌ Error setting up Docker:', error.message);
  }
}

// Setup with local PostgreSQL
async function setupWithLocalPostgreSQL() {
  console.log('\n💻 Setting up with local PostgreSQL...');
  
  console.log('📋 Instructions for local PostgreSQL:');
  console.log('1. Install PostgreSQL if not already installed');
  console.log('2. Start PostgreSQL service');
  console.log('3. Create database: createdb ride_share');
  console.log('4. Set up environment variables in .env file');
  console.log('5. Run: node scripts/setup-analytics.js');
}

// Create .env file
function createEnvFile() {
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

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379
`;

  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with default configuration');
  } else {
    console.log('⚠️ .env file already exists');
  }
}

// Main setup function
async function main() {
  console.log('🔍 Checking system requirements...\n');
  
  const dockerAvailable = await checkDocker();
  const postgresRunning = await checkPostgreSQL();
  
  console.log('\n📋 Setup Options:');
  console.log('1. 🐳 Use Docker (Recommended - Easy setup)');
  console.log('2. 💻 Use local PostgreSQL (Manual setup required)');
  console.log('3. 🔧 Just create .env file');
  console.log('4. 🧪 Test database connection');
  console.log('5. ❌ Exit');
  
  // For now, let's use Docker if available
  if (dockerAvailable) {
    console.log('\n🎯 Recommended: Using Docker for easy setup...');
    createEnvFile();
    await setupWithDocker();
  } else if (postgresRunning) {
    console.log('\n🎯 Using local PostgreSQL...');
    createEnvFile();
    await setupWithLocalPostgreSQL();
  } else {
    console.log('\n❌ No database option available');
    console.log('Please install Docker or PostgreSQL first');
    console.log('\n📚 Installation guides:');
    console.log('- Docker: https://docs.docker.com/get-docker/');
    console.log('- PostgreSQL: https://www.postgresql.org/download/');
  }
}

// Run the setup
main().catch(console.error); 