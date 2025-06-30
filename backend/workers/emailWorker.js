/**
 * Email Worker
 * Processes email jobs from the BullMQ queue
 */

const { Worker } = require('bullmq');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');
const IORedis = require('ioredis');

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
let emailWorker;

async function initializeEmailWorker() {
  try {
    connection = new IORedis(redisConfig);
    
    connection.on('connect', () => {
      logger.info('Email worker: Redis connected');
    });
    
    connection.on('error', (error) => {
      logger.error('Email worker: Redis connection error:', error);
    });
    
    connection.on('close', () => {
      logger.warn('Email worker: Redis connection closed');
    });
    
    await connection.connect();
    
    emailWorker = new Worker('email', async job => {
      try {
        const { to, subject, text, html, attachments } = job.data;
        await sendEmail({ to, subject, text, html, attachments });
        logger.info('Email sent successfully', { to, subject, jobId: job.id });
        return { success: true };
      } catch (error) {
        logger.error('Email sending failed', { 
          error: error.message, 
          jobId: job.id,
          to: job.data.to,
          subject: job.data.subject
        });
        throw error;
      }
    }, { 
      connection,
      concurrency: 5,
      autorun: true,
      maxStalledCount: 1
    });
    
    emailWorker.on('completed', job => {
      logger.info('Email job completed', { id: job.id });
    });
    
    emailWorker.on('failed', (job, err) => {
      logger.error('Email job failed', { 
        id: job.id, 
        error: err.message,
        attempts: job.attemptsMade
      });
    });
    
    emailWorker.on('error', (err) => {
      logger.error('Email worker error:', err);
    });
    
    logger.info('Email worker initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize email worker:', error);
    return false;
  }
}

// Initialize worker on module load
initializeEmailWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Email worker: Shutting down gracefully...');
  if (emailWorker) {
    await emailWorker.close();
  }
  if (connection) {
    await connection.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Email worker: Shutting down gracefully...');
  if (emailWorker) {
    await emailWorker.close();
  }
  if (connection) {
    await connection.quit();
  }
  process.exit(0);
});

module.exports = emailWorker; 