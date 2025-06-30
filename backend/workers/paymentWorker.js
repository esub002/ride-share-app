/**
 * Payment Worker
 * Processes payment jobs from the BullMQ queue
 */

const { Worker } = require('bullmq');
const logger = require('../utils/logger');
const IORedis = require('ioredis');
const { processPayment } = require('../utils/payment');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000
};

let connection;
let paymentWorker;

async function initializePaymentWorker() {
  try {
    connection = new IORedis(redisConfig);
    
    connection.on('connect', () => {
      logger.info('Payment worker: Redis connected');
    });
    
    connection.on('error', (error) => {
      logger.error('Payment worker: Redis connection error:', error);
    });
    
    connection.on('close', () => {
      logger.warn('Payment worker: Redis connection closed');
    });
    
    await connection.connect();
    
    paymentWorker = new Worker('payment', async job => {
      try {
        await processPayment(job.data);
        logger.info('Payment processed successfully', { 
          paymentId: job.data.paymentId || job.id, 
          jobId: job.id 
        });
        return { success: true };
      } catch (error) {
        logger.error('Payment processing failed', { 
          error: error.message, 
          jobId: job.id,
          paymentId: job.data.paymentId
        });
        throw error;
      }
    }, { 
      connection,
      concurrency: 3,
      autorun: true,
      maxStalledCount: 1
    });
    
    paymentWorker.on('completed', job => {
      logger.info('Payment job completed', { id: job.id });
    });
    
    paymentWorker.on('failed', (job, err) => {
      logger.error('Payment job failed', { 
        id: job.id, 
        error: err.message,
        attempts: job.attemptsMade
      });
    });
    
    paymentWorker.on('error', (err) => {
      logger.error('Payment worker error:', err);
    });
    
    logger.info('Payment worker initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize payment worker:', error);
    return false;
  }
}

// Initialize worker on module load
initializePaymentWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Payment worker: Shutting down gracefully...');
  if (paymentWorker) {
    await paymentWorker.close();
  }
  if (connection) {
    await connection.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Payment worker: Shutting down gracefully...');
  if (paymentWorker) {
    await paymentWorker.close();
  }
  if (connection) {
    await connection.quit();
  }
  process.exit(0);
});

module.exports = paymentWorker; 