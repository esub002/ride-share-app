# Background Job Processing System

This document describes the BullMQ-based background job processing system implemented in the ride-share backend.

## 🚀 Overview

The background processing system provides:
- **BullMQ job queues** for email, analytics, and payment processing
- **Asynchronous processing** to improve API response times
- **Job retry mechanisms** with exponential backoff
- **Job monitoring and management** through admin endpoints
- **Scalable worker architecture** for horizontal scaling

## 📦 Dependencies

```bash
npm install bullmq ioredis
```

## 🔧 Configuration

### Environment Variables

```env
# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Job Queue Settings
JOB_RETRY_ATTEMPTS=3
JOB_RETRY_DELAY=5000
JOB_TIMEOUT=30000
```

### Docker Setup

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes
```

## 🏗️ Architecture

### Queue Manager (`utils/queue.js`)

The main queue management system:

```javascript
const { addEmailJob, addAnalyticsJob, addPaymentJob } = require('./utils/queue');

// Add email job
await addEmailJob({
  to: 'user@example.com',
  subject: 'Welcome!',
  text: 'Welcome to our service'
}, { delay: 5000 }); // 5 second delay

// Add analytics job
await addAnalyticsJob({
  event: 'ride_completed',
  userId: 123,
  data: { rideId: 456, fare: 25.50 }
});

// Add payment job
await addPaymentJob({
  amount: 25.50,
  currency: 'USD',
  paymentMethod: 'card',
  rideId: 456
});
```

### Workers

#### Email Worker (`workers/emailWorker.js`)
- Processes email sending jobs
- Handles retries and failures
- Logs email delivery status

#### Analytics Worker (`workers/analyticsWorker.js`)
- Processes analytics events
- Aggregates data for reporting
- Updates analytics database

#### Payment Worker (`workers/paymentWorker.js`)
- Processes payment transactions
- Handles payment gateway integration
- Manages payment receipts and confirmations

## 🔌 Usage Examples

### Email Processing

```javascript
// In your route handler
router.post('/send-welcome-email', async (req, res) => {
  const { email, name } = req.body;
  
  // Add email job to queue (non-blocking)
  await addEmailJob({
    to: email,
    subject: `Welcome ${name}!`,
    text: `Hi ${name}, welcome to our ride-sharing service!`,
    html: `<h1>Welcome ${name}!</h1><p>Welcome to our ride-sharing service!</p>`
  }, {
    delay: 1000, // 1 second delay
    attempts: 3,  // Retry 3 times
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
  
  res.json({ message: 'Welcome email queued successfully' });
});
```

### Analytics Processing

```javascript
// In your ride completion handler
router.post('/rides/:id/complete', async (req, res) => {
  const rideId = req.params.id;
  
  // Process ride completion immediately
  await completeRide(rideId);
  
  // Queue analytics processing (non-blocking)
  await addAnalyticsJob({
    event: 'ride_completed',
    rideId,
    userId: req.user.id,
    driverId: req.body.driverId,
    data: {
      fare: req.body.fare,
      distance: req.body.distance,
      duration: req.body.duration
    }
  });
  
  res.json({ message: 'Ride completed successfully' });
});
```

### Payment Processing

```javascript
// In your payment handler
router.post('/payments', async (req, res) => {
  const { amount, paymentMethod, rideId } = req.body;
  
  // Queue payment processing (non-blocking)
  const paymentJob = await addPaymentJob({
    amount,
    currency: 'USD',
    paymentMethod,
    rideId,
    userId: req.user.id
  }, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
  
  res.json({ 
    message: 'Payment queued successfully',
    jobId: paymentJob.id
  });
});
```

## 📊 Job Monitoring

### Queue Statistics

```javascript
const { emailQueue, analyticsQueue, paymentQueue } = require('./utils/queue');

// Get queue statistics
const emailStats = await emailQueue.getJobCounts();
const analyticsStats = await analyticsQueue.getJobCounts();
const paymentStats = await paymentQueue.getJobCounts();
```

### Job Status

```javascript
// Get job by ID
const job = await emailQueue.getJob(jobId);
const status = await job.getState(); // 'completed', 'failed', 'active', etc.
const result = await job.returnvalue;
```

## 🔧 Configuration Options

### Job Options

```javascript
const jobOptions = {
  delay: 5000,           // Delay job execution by 5 seconds
  attempts: 3,           // Retry failed jobs 3 times
  backoff: {
    type: 'exponential', // Exponential backoff
    delay: 2000          // Initial delay of 2 seconds
  },
  timeout: 30000,        // Job timeout of 30 seconds
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50       // Keep last 50 failed jobs
};
```

### Worker Configuration

```javascript
const workerOptions = {
  connection,
  concurrency: 5,        // Process 5 jobs concurrently
  autorun: true,         // Start processing immediately
  maxStalledCount: 1     // Mark job as failed after 1 stall
};
```

## 🚨 Error Handling

### Job Failure Handling

```javascript
worker.on('failed', (job, err) => {
  logger.error('Job failed', {
    jobId: job.id,
    queue: job.queue.name,
    error: err.message,
    data: job.data
  });
  
  // Send alert for critical failures
  if (job.queue.name === 'payment') {
    sendAlert('Payment processing failed', { jobId: job.id, error: err.message });
  }
});
```

### Retry Logic

```javascript
// Jobs are automatically retried based on configuration
// Failed jobs can be manually retried
await failedJob.retry();

// Or retry with new data
await failedJob.retry({ ...job.data, retryCount: job.data.retryCount + 1 });
```

## 🔒 Security Considerations

- **Job Data**: Sensitive data should be encrypted or stored securely
- **Access Control**: Job monitoring endpoints require admin privileges
- **Rate Limiting**: Job creation should be rate-limited
- **Validation**: Job data should be validated before processing

## 📝 Best Practices

1. **Keep Jobs Small**: Break large tasks into smaller, manageable jobs
2. **Handle Failures**: Always implement proper error handling in workers
3. **Monitor Performance**: Track job processing times and failure rates
4. **Use Appropriate Delays**: Use delays for non-urgent tasks
5. **Clean Up**: Configure job cleanup to prevent memory issues
6. **Log Everything**: Log job creation, processing, and completion

## 🔍 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify connection settings
   - Check network connectivity

2. **Jobs Not Processing**
   - Check worker status
   - Verify job data format
   - Check for worker errors

3. **High Failure Rate**
   - Review job data validation
   - Check external service dependencies
   - Review error handling

4. **Memory Issues**
   - Configure job cleanup
   - Monitor job queue sizes
   - Review job data size

### Debug Commands

```bash
# Check Redis status
redis-cli ping

# Monitor Redis operations
redis-cli monitor

# Check BullMQ keys
redis-cli keys "bull:*"
```

## 📚 Additional Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)
- [Node.js Background Jobs](https://nodejs.org/en/docs/guides/background-jobs/) 