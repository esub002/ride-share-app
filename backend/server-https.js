const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import the main app
const app = require('./server');

// SSL/TLS Configuration
const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/private.key'),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/certificate.crt'),
  ca: process.env.SSL_CA_PATH ? fs.readFileSync(process.env.SSL_CA_PATH) : undefined
};

// Create HTTPS server
const server = https.createServer(sslOptions, app);

// Initialize Socket.IO with HTTPS
const io = new Server(server, {
  cors: { origin: '*' }
});

// Enhanced security headers for HTTPS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Enhanced CORS for HTTPS
const allowedOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ['https://yourdomain.com', 'https://app.yourdomain.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Production rate limiting
const productionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(productionLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    ssl: true
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Secure client connected: ${socket.id}`);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Secure client disconnected: ${socket.id}`);
  });
});

// Start HTTPS server
const PORT = process.env.PORT || 443;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🔒 HTTPS Server running on https://${HOST}:${PORT}`);
  console.log(`📖 API Documentation: https://${HOST}:${PORT}/api-docs`);
  console.log(`🏥 Health Check: https://${HOST}:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ HTTPS server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ HTTPS server closed');
    process.exit(0);
  });
});

module.exports = server; 