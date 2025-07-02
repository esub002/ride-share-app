#!/usr/bin/env node

/**
 * Generate Secure Production Secrets
 * 
 * This script generates secure random values for production environment variables.
 * Run this script to generate secure secrets for your production deployment.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Function to generate secure random strings
function generateSecureString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Function to generate JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Function to generate encryption key
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Function to generate API key
function generateAPIKey() {
  return `rs_${crypto.randomBytes(32).toString('hex')}`;
}

// Function to generate Redis password
function generateRedisPassword() {
  return crypto.randomBytes(16).toString('hex');
}

// Function to generate database password
function generateDBPassword() {
  return crypto.randomBytes(16).toString('hex');
}

// Function to generate session secret
function generateSessionSecret() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('🔐 Generating Secure Production Secrets...\n');

const secrets = {
  // JWT Secrets
  JWT_SECRET: generateJWTSecret(),
  JWT_REFRESH_SECRET: generateJWTSecret(),
  
  // Security Keys
  ENCRYPTION_KEY: generateEncryptionKey(),
  API_KEY_SECRET: generateSecureString(32),
  SESSION_SECRET: generateSessionSecret(),
  
  // Database
  DB_PASSWORD: generateDBPassword(),
  
  // Redis
  REDIS_PASSWORD: generateRedisPassword(),
  
  // API Keys
  API_KEY: generateAPIKey(),
};

console.log('✅ Generated Secure Secrets:\n');

// Display secrets
Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📝 Copy these values to your env.production file');
console.log('⚠️  IMPORTANT: Keep these secrets secure and never commit them to version control!');

// Optionally save to a temporary file
const tempFile = path.join(__dirname, '..', 'temp-secrets.txt');
const secretContent = Object.entries(secrets)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(tempFile, secretContent);
console.log(`\n💾 Secrets also saved to: ${tempFile}`);
console.log('🗑️  Remember to delete this file after copying the secrets!');

// Generate a sample .env.production with placeholders
const sampleEnvPath = path.join(__dirname, '..', 'env.production.sample');
const sampleContent = `# ========================================
# PRODUCTION ENVIRONMENT VARIABLES - SAMPLE
# ========================================
# Copy this file to env.production and replace placeholder values

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=ride_share_production
DB_USER=ride_share_user
DB_PASSWORD=${secrets.DB_PASSWORD}
DATABASE_URL=postgresql://ride_share_user:${secrets.DB_PASSWORD}@your-production-db-host:5432/ride_share_production

# Redis Configuration
REDIS_HOST=your-production-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=${secrets.REDIS_PASSWORD}
REDIS_DB=0
REDIS_PREFIX=rideshare_prod:

# JWT Configuration
JWT_SECRET=${secrets.JWT_SECRET}
JWT_REFRESH_SECRET=${secrets.JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}
API_KEY_SECRET=${secrets.API_KEY_SECRET}
BCRYPT_ROUNDS=12

# Session Configuration
SESSION_SECRET=${secrets.SESSION_SECRET}
SESSION_MAX_AGE=86400000

# API Key
API_KEY=${secrets.API_KEY}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Email Configuration (UPDATE THESE)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
ERROR_LOG_FILE=logs/error.log

# Socket.IO Configuration (UPDATE THIS)
SOCKET_CORS_ORIGIN=https://your-frontend-domain.com
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000

# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_DB_NAME=ride_share_analytics_production

# Safety Configuration (UPDATE THESE)
SAFETY_ALERT_EMAIL=safety@yourdomain.com
EMERGENCY_CONTACT=911

# Password Policy
MIN_PASSWORD_LENGTH=8
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_NUMBERS=true
REQUIRE_SPECIAL_CHARS=true

# Login Security
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=900000
REQUIRE_EMAIL_VERIFICATION=true

# Development Settings (DISABLE IN PRODUCTION)
ENABLE_MOCK_DATA=false
ENABLE_DEBUG_LOGGING=false
SKIP_EMAIL_VERIFICATION=false

# Third Party API Keys (UPDATE THESE)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Security Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Background Jobs Configuration
BULLMQ_REDIS_URL=redis://:${secrets.REDIS_PASSWORD}@your-production-redis-host:6379/1
BULLMQ_PREFIX=rideshare_jobs:

# Monitoring and Health Checks
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true

# Sentry Configuration (Optional)
SENTRY_DSN=your-sentry-dsn-url
`;

fs.writeFileSync(sampleEnvPath, sampleContent);
console.log(`📄 Sample env.production file created: ${sampleEnvPath}`);

console.log('\n🎯 Next Steps:');
console.log('1. Copy the generated secrets to your env.production file');
console.log('2. Update the remaining placeholder values (email, API keys, etc.)');
console.log('3. Set up your production database and Redis instances');
console.log('4. Deploy using docker-compose.prod.yml');
console.log('5. Delete the temp-secrets.txt file for security'); 