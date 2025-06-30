/**
 * Analytics Worker
 * Processes analytics jobs from the BullMQ queue
 */

const { Worker } = require('bullmq');
const logger = require('../utils/logger');
const IORedis = require('ioredis');
const { processAnalyticsEvent } = require('../utils/analytics');

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
let analyticsWorker;

async function initializeAnalyticsWorker() {
  try {
    connection = new IORedis(redisConfig);
    
    connection.on('connect', () => {
      logger.info('Analytics worker: Redis connected');
    });
    
    connection.on('error', (error) => {
      logger.error('Analytics worker: Redis connection error:', error);
    });
    
    connection.on('close', () => {
      logger.warn('Analytics worker: Redis connection closed');
    });
    
    await connection.connect();
    
    analyticsWorker = new Worker('analytics', async job => {
      try {
        await processAnalyticsEvent(job.data);
        logger.info('Analytics event processed successfully', { 
          event: job.data.event, 
          jobId: job.id 
        });
        return { success: true };
      } catch (error) {
        logger.error('Analytics processing failed', { 
          error: error.message, 
          jobId: job.id,
          event: job.data.event
        });
        throw error;
      }
    }, { 
      connection,
      concurrency: 10,
      autorun: true,
      maxStalledCount: 1
    });
    
    analyticsWorker.on('completed', job => {
      logger.info('Analytics job completed', { id: job.id });
    });
    
    analyticsWorker.on('failed', (job, err) => {
      logger.error('Analytics job failed', { 
        id: job.id, 
        error: err.message,
        attempts: job.attemptsMade
      });
    });
    
    analyticsWorker.on('error', (err) => {
      logger.error('Analytics worker error:', err);
    });
    
    logger.info('Analytics worker initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize analytics worker:', error);
    return false;
  }
}

// Initialize worker on module load
initializeAnalyticsWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Analytics worker: Shutting down gracefully...');
  if (analyticsWorker) {
    await analyticsWorker.close();
  }
  if (connection) {
    await connection.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Analytics worker: Shutting down gracefully...');
  if (analyticsWorker) {
    await analyticsWorker.close();
  }
  if (connection) {
    await connection.quit();
  }
  process.exit(0);
});

module.exports = analyticsWorker; 