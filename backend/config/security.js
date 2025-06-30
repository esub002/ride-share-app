/**
 * Security Configuration
 * Centralized security settings for the Ride Share App
 */

require('dotenv').config();

const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_this_in_production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secure_jwt_refresh_secret_key_change_this_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  },

  // Encryption Configuration
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_for_sensitive_data',
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc',
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },

  // API Keys
  apiKeys: {
    keys: [
      process.env.API_KEY_1,
      process.env.API_KEY_2,
      process.env.API_KEY_3
    ].filter(Boolean)
  },

  // Rate Limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
    apiMaxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 1000
  },

  // Password Policy
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },

  // Session Management
  session: {
    timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 60,
    maxConcurrentSessions: 5,
    cleanupInterval: 15 * 60 * 1000 // 15 minutes
  },

  // Login Security
  login: {
    maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDurationMinutes: parseInt(process.env.LOGIN_LOCKOUT_DURATION_MINUTES) || 15,
    requireEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
    requirePhoneVerification: process.env.ENABLE_SMS_VERIFICATION === 'true'
  },

  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      [
        'http://localhost:3000',
        'http://localhost:19006',
        'exp://localhost:19000',
        'http://localhost:3001',
        'http://localhost:3002'
      ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Client-Version'
    ]
  },

  // Helmet Configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  },

  // Audit Logging
  audit: {
    enabled: process.env.ENABLE_AUDIT_LOGGING !== 'false',
    retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 90,
    logSensitiveData: false,
    logPasswords: false
  },

  // Security Headers
  headers: {
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'geolocation=(), microphone=(), camera=()'
  },

  // Request Limits
  request: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    maxFileSize: 2 * 1024 * 1024 // 2MB
  },

  // Feature Flags
  features: {
    twoFactorAuth: process.env.ENABLE_TWO_FACTOR_AUTH !== 'false',
    smsVerification: process.env.ENABLE_SMS_VERIFICATION === 'true',
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
    rateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
    apiKeyAuth: process.env.ENABLE_API_KEY_AUTH !== 'false'
  },

  // Development Settings
  development: {
    skipAuthentication: process.env.SKIP_AUTHENTICATION === 'true',
    mockDatabase: process.env.MOCK_DATABASE === 'true',
    debugMode: process.env.DEBUG_MODE === 'true',
    showSqlQueries: process.env.SHOW_SQL_QUERIES === 'true'
  },

  // Environment
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    sentryDsn: process.env.SENTRY_DSN
  },

  // Server
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: process.env.TRUST_PROXY === 'true'
  },

  // Database
  database: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'ride_share',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ride_share'}`
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@rideshare.com'
  },

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Third-party APIs
  apis: {
    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID
    }
  }
};

// Validation function to check required configuration
const validateConfig = () => {
  const errors = [];

  // Check JWT secrets
  if (securityConfig.jwt.secret === 'your_super_secure_jwt_secret_key_change_this_in_production') {
    errors.push('JWT_SECRET must be set to a secure value in production');
  }

  if (securityConfig.jwt.refreshSecret === 'your_super_secure_jwt_refresh_secret_key_change_this_in_production') {
    errors.push('JWT_REFRESH_SECRET must be set to a secure value in production');
  }

  // Check encryption key
  if (securityConfig.encryption.key === 'your_32_character_encryption_key_for_sensitive_data') {
    errors.push('ENCRYPTION_KEY must be set to a secure 32-character value in production');
  }

  // Check database configuration
  if (!securityConfig.database.password || securityConfig.database.password === 'password') {
    errors.push('DB_PASSWORD must be set to a secure value');
  }

  // Check email configuration
  if (!securityConfig.email.user || !securityConfig.email.pass) {
    errors.push('SMTP_USER and SMTP_PASS must be set for email functionality');
  }

  // Production-specific checks
  if (securityConfig.isProduction) {
    if (securityConfig.development.skipAuthentication) {
      errors.push('SKIP_AUTHENTICATION cannot be true in production');
    }

    if (securityConfig.development.mockDatabase) {
      errors.push('MOCK_DATABASE cannot be true in production');
    }

    if (securityConfig.development.debugMode) {
      errors.push('DEBUG_MODE cannot be true in production');
    }

    if (securityConfig.logging.level === 'debug') {
      errors.push('LOG_LEVEL should not be debug in production');
    }
  }

  return errors;
};

// Get configuration for specific environment
const getConfig = (key) => {
  const keys = key.split('.');
  let value = securityConfig;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
};

// Export configuration
module.exports = {
  config: securityConfig,
  validate: validateConfig,
  get: getConfig
}; 