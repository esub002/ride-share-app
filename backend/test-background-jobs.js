/**
 * Test script for background job processing system
 * Run with: node test-background-jobs.js
 */

const { addEmailJob, addAnalyticsJob, addPaymentJob, getQueueStats } = require('./utils/queue');
const logger = require('./utils/logger');

async function testBackgroundJobs() {
  console.log('🧪 Testing Background Job Processing System...\n');

  try {
    // Test 1: Add email job
    console.log('📧 Testing email job...');
    const emailJob = await addEmailJob({
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email from the background job system',
      html: '<h1>Test Email</h1><p>This is a test email from the background job system</p>'
    }, { delay: 2000 });
    
    if (emailJob) {
      console.log('✅ Email job added successfully:', emailJob.id);
    } else {
      console.log('⚠️ Email job not added (queue may not be available)');
    }

    // Test 2: Add analytics job
    console.log('\n📊 Testing analytics job...');
    const analyticsJob = await addAnalyticsJob({
      event: 'test_event',
      userId: 123,
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });
    
    if (analyticsJob) {
      console.log('✅ Analytics job added successfully:', analyticsJob.id);
    } else {
      console.log('⚠️ Analytics job not added (queue may not be available)');
    }

    // Test 3: Add payment job
    console.log('\n💳 Testing payment job...');
    const paymentJob = await addPaymentJob({
      amount: 25.50,
      currency: 'USD',
      paymentMethod: 'card',
      rideId: 456,
      userId: 123
    });
    
    if (paymentJob) {
      console.log('✅ Payment job added successfully:', paymentJob.id);
    } else {
      console.log('⚠️ Payment job not added (queue may not be available)');
    }

    // Test 4: Get queue statistics
    console.log('\n📈 Getting queue statistics...');
    const stats = await getQueueStats();
    console.log('Queue Statistics:', JSON.stringify(stats, null, 2));

    console.log('\n🎉 Background job system test completed!');
    console.log('\n💡 To see jobs being processed, start the workers:');
    console.log('   node workers/emailWorker.js');
    console.log('   node workers/analyticsWorker.js');
    console.log('   node workers/paymentWorker.js');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    logger.error('Background job test failed', { error: error.message });
  }
}

// Run the test
testBackgroundJobs().then(() => {
  console.log('\n🏁 Test script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script crashed:', error);
  process.exit(1);
}); 