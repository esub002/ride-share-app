/**
 * BullMQ Job Queue Manager
 * Provides job queueing and background processing for email, analytics, and payments
 */

const { Queue, Worker, QueueScheduler, Job } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('./logger');

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
let emailQueue, analyticsQueue, paymentQueue;
let isConnected = false;

// Initialize Redis connection
async function initializeQueues() {
  try {
    connection = new IORedis(redisConfig);
    
    connection.on('connect', () => {
      logger.info('Redis connected for job queues');
      isConnected = true;
    });
    
    connection.on('error', (error) => {
      logger.error('Redis connection error for job queues:', error);
      isConnected = false;
    });
    
    connection.on('close', () => {
      logger.warn('Redis connection closed for job queues');
      isConnected = false;
    });
    
    await connection.connect();
    
    // Define queues
    emailQueue = new Queue('email', { connection });
    analyticsQueue = new Queue('analytics', { connection });
    paymentQueue = new Queue('payment', { connection });
    
    // Schedulers for delayed/repeatable jobs
    new QueueScheduler('email', { connection });
    new QueueScheduler('analytics', { connection });
    new QueueScheduler('payment', { connection });
    
    logger.info('Job queues initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize job queues:', error);
    return false;
  }
}

// Producer functions with error handling
const addEmailJob = async (data, opts = {}) => {
  if (!isConnected || !emailQueue) {
    logger.warn('Email queue not available, job not queued');
    return null;
  }
  
  try {
    const job = await emailQueue.add('sendEmail', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 50,
      ...opts
    });
    
    logger.debug('Email job added to queue', { jobId: job.id });
    return job;
  } catch (error) {
    logger.error('Failed to add email job to queue:', error);
    throw error;
  }
};

const addAnalyticsJob = async (data, opts = {}) => {
  if (!isConnected || !analyticsQueue) {
    logger.warn('Analytics queue not available, job not queued');
    return null;
  }
  
  try {
    const job = await analyticsQueue.add('processAnalytics', data, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: 200,
      removeOnFail: 100,
      ...opts
    });
    
    logger.debug('Analytics job added to queue', { jobId: job.id });
    return job;
  } catch (error) {
    logger.error('Failed to add analytics job to queue:', error);
    throw error;
  }
};

const addPaymentJob = async (data, opts = {}) => {
  if (!isConnected || !paymentQueue) {
    logger.warn('Payment queue not available, job not queued');
    return null;
  }
  
  try {
    const job = await paymentQueue.add('processPayment', data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 50,
      removeOnFail: 25,
      ...opts
    });
    
    logger.debug('Payment job added to queue', { jobId: job.id });
    return job;
  } catch (error) {
    logger.error('Failed to add payment job to queue:', error);
    throw error;
  }
};

// Get queue statistics
const getQueueStats = async () => {
  if (!isConnected) {
    return { connected: false };
  }
  
  try {
    const emailStats = await emailQueue.getJobCounts();
    const analyticsStats = await analyticsQueue.getJobCounts();
    const paymentStats = await paymentQueue.getJobCounts();
    
    return {
      connected: true,
      email: emailStats,
      analytics: analyticsStats,
      payment: paymentStats
    };
  } catch (error) {
    logger.error('Failed to get queue statistics:', error);
    return { connected: false, error: error.message };
  }
};

// Cleanup function
const cleanup = async () => {
  if (connection) {
    await connection.quit();
    isConnected = false;
    logger.info('Job queue connection closed');
  }
};

// Initialize queues on module load
initializeQueues();

module.exports = {
  emailQueue: () => emailQueue,
  analyticsQueue: () => analyticsQueue,
  paymentQueue: () => paymentQueue,
  addEmailJob,
  addAnalyticsJob,
  addPaymentJob,
  getQueueStats,
  cleanup,
  isConnected: () => isConnected
}; 