const { Pool } = require('pg');
const crypto = require('crypto');
const { logEvent } = require('../utils/log');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ride_share',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  
  // Connection pooling configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Connection pool event handlers
pool.on('connect', (client) => {
  logEvent('db_connection_created', {
    clientId: client.id,
    timestamp: new Date().toISOString()
  });
});

pool.on('acquire', (client) => {
  logEvent('db_connection_acquired', {
    clientId: client.id,
    timestamp: new Date().toISOString()
  });
});

pool.on('release', (client) => {
  logEvent('db_connection_released', {
    clientId: client.id,
    timestamp: new Date().toISOString()
  });
});

pool.on('error', (err, client) => {
  logEvent('db_connection_error', {
    error: err.message,
    clientId: client?.id,
    timestamp: new Date().toISOString()
  });
  console.error('Unexpected error on idle client', err);
});

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text
 */
const encryptData = (text) => {
  if (!text) return text;
  
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text to decrypt
 * @returns {string} Decrypted text
 */
const decryptData = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = textParts.join(':');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logEvent('decryption_error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return null;
  }
};

/**
 * Hash sensitive data (one-way encryption)
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
const hashData = (text) => {
  if (!text) return text;
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Secure query execution with prepared statements
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {Object} options - Query options
 * @returns {Promise} Query result
 */
const secureQuery = async (text, params = [], options = {}) => {
  const startTime = Date.now();
  const queryId = crypto.randomBytes(8).toString('hex');
  
  try {
    // Log query execution
    logEvent('db_query_start', {
      queryId,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params: params.map(p => typeof p === 'string' ? p.substring(0, 50) + (p.length > 50 ? '...' : '') : p),
      timestamp: new Date().toISOString()
    });
    
    // Execute query with prepared statement
    const result = await pool.query(text, params);
    
    const duration = Date.now() - startTime;
    
    // Log successful query
    logEvent('db_query_success', {
      queryId,
      duration: `${duration}ms`,
      rowCount: result.rowCount,
      timestamp: new Date().toISOString()
    });
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log query error
    logEvent('db_query_error', {
      queryId,
      error: error.message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};

/**
 * Transaction wrapper with automatic rollback on error
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise} Transaction result
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  const transactionId = crypto.randomBytes(8).toString('hex');
  
  try {
    await client.query('BEGIN');
    
    logEvent('db_transaction_start', {
      transactionId,
      timestamp: new Date().toISOString()
    });
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    
    logEvent('db_transaction_commit', {
      transactionId,
      timestamp: new Date().toISOString()
    });
    
    return result;
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    logEvent('db_transaction_rollback', {
      transactionId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
    
  } finally {
    client.release();
  }
};

/**
 * Audit logging middleware
 * @param {string} action - Action being performed
 * @param {string} table - Table being affected
 * @param {Object} data - Data being processed
 * @returns {Function} Middleware function
 */
const auditLog = (action, table, data = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Log audit event after response is sent
      const auditData = {
        action,
        table,
        userId: req.user?.id,
        userRole: req.user?.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        data: {
          ...data,
          requestBody: req.body,
          requestParams: req.params,
          requestQuery: req.query
        },
        timestamp: new Date().toISOString()
      };
      
      // Don't log sensitive data
      if (auditData.data.requestBody?.password) {
        auditData.data.requestBody.password = '[REDACTED]';
      }
      
      logEvent('audit_log', auditData);
      
      // Store audit log in database
      storeAuditLog(auditData).catch(err => {
        console.error('Failed to store audit log:', err);
      });
      
      originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Store audit log in database
 * @param {Object} auditData - Audit data to store
 */
const storeAuditLog = async (auditData) => {
  try {
    await secureQuery(
      `INSERT INTO audit_logs (
        action, table_name, user_id, user_role, ip_address, user_agent,
        method, url, status_code, data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        auditData.action,
        auditData.table,
        auditData.userId,
        auditData.userRole,
        auditData.ip,
        auditData.userAgent,
        auditData.method,
        auditData.url,
        auditData.statusCode,
        JSON.stringify(auditData.data),
        auditData.timestamp
      ]
    );
  } catch (error) {
    console.error('Failed to store audit log:', error);
  }
};

/**
 * Database health check
 * @returns {Promise<Object>} Health check result
 */
const healthCheck = async () => {
  try {
    const result = await secureQuery('SELECT NOW() as timestamp, version() as version');
    
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version,
      poolSize: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Database connection pool statistics
 * @returns {Object} Pool statistics
 */
const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

/**
 * Close database connection pool
 * @returns {Promise} Close result
 */
const closePool = async () => {
  await pool.end();
  logEvent('db_pool_closed', {
    timestamp: new Date().toISOString()
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await closePool();
  process.exit(0);
});

module.exports = {
  pool,
  secureQuery,
  transaction,
  auditLog,
  encryptData,
  decryptData,
  hashData,
  healthCheck,
  getPoolStats,
  closePool
}; 