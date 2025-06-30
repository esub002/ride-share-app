// auth.js - JWT authentication middleware
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { logEvent } = require('../utils/log');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Token blacklist for logout (in production, use Redis)
const tokenBlacklist = new Set();

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {string} JWT token
 */
const generateToken = (payload, type = 'access') => {
  const secret = type === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET;
  const expiresIn = type === 'refresh' ? JWT_REFRESH_EXPIRES_IN : JWT_EXPIRES_IN;
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, type = 'access') => {
  const secret = type === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET;
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} Token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token
 * @returns {boolean} True if blacklisted
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Blacklist a token (for logout)
 * @param {string} token - JWT token to blacklist
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up old tokens periodically (in production, use Redis with TTL)
  if (tokenBlacklist.size > 1000) {
    const tokens = Array.from(tokenBlacklist);
    tokenBlacklist.clear();
    // Keep only recent tokens (this is a simple implementation)
    tokens.slice(-500).forEach(t => tokenBlacklist.add(t));
  }
};

/**
 * Main authentication middleware
 * @param {string} requiredRole - Required role for the route
 * @returns {Function} Express middleware function
 */
const authMiddleware = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      // Extract token from headers
      const token = extractToken(req);
      
      if (!token) {
        return res.status(401).json({ 
          error: 'Access token required',
          code: 'MISSING_TOKEN'
        });
      }
      
      // Check if token is blacklisted
      if (isTokenBlacklisted(token)) {
        return res.status(401).json({ 
          error: 'Token has been revoked',
          code: 'TOKEN_REVOKED'
        });
      }
      
      // Verify token
      const decoded = verifyToken(token, 'access');
      
      // Validate user exists and is active
      const userQuery = decoded.role === 'driver' ? 
        'SELECT * FROM drivers WHERE id = $1 AND verified = TRUE' :
        'SELECT * FROM users WHERE id = $1 AND verified = TRUE';
      
      const userResult = await pool.query(userQuery, [decoded.userId || decoded.driverId]);
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ 
          error: 'User not found or not verified',
          code: 'USER_NOT_FOUND'
        });
      }
      
      const user = userResult.rows[0];
      
      // Check role-based access control
      if (requiredRole && decoded.role !== requiredRole) {
        logEvent('unauthorized_access', {
          userId: user.id,
          userRole: decoded.role,
          requiredRole,
          endpoint: req.originalUrl,
          ip: req.ip
        });
        
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };
      
      // Add token info for potential refresh
      req.token = {
        original: token,
        decoded,
        expiresAt: new Date(decoded.exp * 1000)
      };
      
      next();
      
    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error.message.includes('jwt expired')) {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.message.includes('jwt malformed')) {
        return res.status(401).json({ 
          error: 'Invalid token format',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({ 
        error: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @returns {Function} Express middleware function
 */
const optionalAuth = () => {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      
      if (!token) {
        return next(); // Continue without authentication
      }
      
      if (isTokenBlacklisted(token)) {
        return next(); // Continue without authentication
      }
      
      const decoded = verifyToken(token, 'access');
      
      // Validate user exists
      const userQuery = decoded.role === 'driver' ? 
        'SELECT * FROM drivers WHERE id = $1 AND verified = TRUE' :
        'SELECT * FROM users WHERE id = $1 AND verified = TRUE';
      
      const userResult = await pool.query(userQuery, [decoded.userId || decoded.driverId]);
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        req.user = {
          id: user.id,
          email: user.email,
          role: decoded.role,
          permissions: decoded.permissions || []
        };
      }
      
      next();
      
    } catch (error) {
      // Continue without authentication on error
      next();
    }
  };
};

/**
 * Refresh token middleware
 * @returns {Function} Express middleware function
 */
const refreshToken = () => {
  return async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ 
          error: 'Refresh token required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }
      
      // Verify refresh token
      const decoded = verifyToken(refreshToken, 'refresh');
      
      // Check if refresh token is blacklisted
      if (isTokenBlacklisted(refreshToken)) {
        return res.status(401).json({ 
          error: 'Refresh token has been revoked',
          code: 'REFRESH_TOKEN_REVOKED'
        });
      }
      
      // Validate user exists
      const userQuery = decoded.role === 'driver' ? 
        'SELECT * FROM drivers WHERE id = $1 AND verified = TRUE' :
        'SELECT * FROM users WHERE id = $1 AND verified = TRUE';
      
      const userResult = await pool.query(userQuery, [decoded.userId || decoded.driverId]);
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ 
          error: 'User not found or not verified',
          code: 'USER_NOT_FOUND'
        });
      }
      
      const user = userResult.rows[0];
      
      // Generate new tokens
      const newAccessToken = generateToken({
        userId: user.id,
        role: decoded.role,
        permissions: decoded.permissions
      }, 'access');
      
      const newRefreshToken = generateToken({
        userId: user.id,
        role: decoded.role,
        permissions: decoded.permissions
      }, 'refresh');
      
      // Blacklist old refresh token
      blacklistToken(refreshToken);
      
      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes
        refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days
      });
      
    } catch (error) {
      console.error('Token refresh error:', error);
      
      if (error.message.includes('jwt expired')) {
        return res.status(401).json({ 
          error: 'Refresh token expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        error: 'Token refresh failed',
        code: 'REFRESH_FAILED'
      });
    }
  };
};

/**
 * Logout middleware
 * @returns {Function} Express middleware function
 */
const logout = () => {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      
      if (token) {
        blacklistToken(token);
      }
      
      res.json({ message: 'Logged out successfully' });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  };
};

// Export all authentication functions
module.exports = {
  auth: authMiddleware,
  optionalAuth,
  refreshToken,
  logout,
  generateToken,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted
};

// For backward compatibility
module.exports.default = authMiddleware;
