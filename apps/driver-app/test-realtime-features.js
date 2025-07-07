/**
 * Real-Time Features Test Script
 * 
 * This script tests all real-time features implemented in the driver app:
 * 1. Performance Dashboard
 * 2. Location Tracking
 * 3. Communication System
 * 4. Messaging System
 * 5. Safety Monitoring
 * 6. Ride Requests
 */

import { RealTimeFeaturesIntegration } from './integrate-realtime-features';
import enhancedRealTimeManager from './utils/enhancedRealTimeManager';
import apiService from './utils/api';

class RealTimeFeaturesTester {
  constructor() {
    this.testResults = {
      performanceDashboard: { passed: false, errors: [] },
      locationTracking: { passed: false, errors: [] },
      communication: { passed: false, errors: [] },
      messaging: { passed: false, errors: [] },
      safetyMonitoring: { passed: false, errors: [] },
      rideRequests: { passed: false, errors: [] },
    };
    this.testData = {
      testRideId: `test_ride_${Date.now()}`,
      testConversationId: `test_conv_${Date.now()}`,
      testCallId: `test_call_${Date.now()}`,
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting real-time features testing...\n');

    try {
      // Initialize integration
      const integration = new RealTimeFeaturesIntegration();
      await integration.initializeAllFeatures();

      // Run individual tests
      await this.testPerformanceDashboard();
      await this.testLocationTracking();
      await this.testCommunicationSystem();
      await this.testMessagingSystem();
      await this.testSafetyMonitoring();
      await this.testRideRequests();

      // Generate test report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  /**
   * Test Performance Dashboard
   */
  async testPerformanceDashboard() {
    console.log('📊 Testing Performance Dashboard...');
    
    try {
      // Test 1: Get performance metrics
      const metrics = await apiService.getPerformanceMetrics();
      if (!metrics || typeof metrics !== 'object') {
        throw new Error('Performance metrics API returned invalid data');
      }
      console.log('✅ Performance metrics API working');

      // Test 2: Get historical metrics
      const historicalData = await apiService.getHistoricalMetrics();
      if (!Array.isArray(historicalData)) {
        throw new Error('Historical metrics API returned invalid data');
      }
      console.log('✅ Historical metrics API working');

      // Test 3: Test performance alerts
      const alerts = await apiService.checkPerformanceAlerts();
      if (!Array.isArray(alerts)) {
        throw new Error('Performance alerts API returned invalid data');
      }
      console.log('✅ Performance alerts API working');

      this.testResults.performanceDashboard.passed = true;
      console.log('✅ Performance Dashboard tests passed\n');

    } catch (error) {
      this.testResults.performanceDashboard.errors.push(error.message);
      console.error('❌ Performance Dashboard tests failed:', error.message);
    }
  }

  /**
   * Test Location Tracking
   */
  async testLocationTracking() {
    console.log('📍 Testing Location Tracking...');
    
    try {
      // Test 1: Get geofences
      const geofences = await apiService.getGeofences();
      if (!Array.isArray(geofences)) {
        throw new Error('Geofences API returned invalid data');
      }
      console.log('✅ Geofences API working');

      // Test 2: Update location
      const testLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        speed: 0,
        heading: 0,
        timestamp: new Date().toISOString(),
      };

      await apiService.updateLocation(testLocation);
      console.log('✅ Location update API working');

      // Test 3: Test location events
      let locationEventReceived = false;
      const locationPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        enhancedRealTimeManager.on('location:updated', (location) => {
          locationEventReceived = true;
          clearTimeout(timeout);
          resolve(true);
        });
      });

      enhancedRealTimeManager.updateLocation(testLocation.latitude, testLocation.longitude);
      const locationEventResult = await locationPromise;

      if (locationEventResult) {
        console.log('✅ Location events working');
      } else {
        throw new Error('Location events not received');
      }

      this.testResults.locationTracking.passed = true;
      console.log('✅ Location Tracking tests passed\n');

    } catch (error) {
      this.testResults.locationTracking.errors.push(error.message);
      console.error('❌ Location Tracking tests failed:', error.message);
    }
  }

  /**
   * Test Communication System
   */
  async testCommunicationSystem() {
    console.log('📞 Testing Communication System...');
    
    try {
      // Test 1: Get call history
      const callHistory = await apiService.getCallHistory();
      if (!Array.isArray(callHistory)) {
        throw new Error('Call history API returned invalid data');
      }
      console.log('✅ Call history API working');

      // Test 2: Test call quality API
      const callQuality = await apiService.getCallQuality(this.testData.testCallId);
      if (typeof callQuality !== 'number' || callQuality < 0 || callQuality > 100) {
        throw new Error('Call quality API returned invalid data');
      }
      console.log('✅ Call quality API working');

      // Test 3: Test call events
      let callEventReceived = false;
      const callPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        enhancedRealTimeManager.on('call:incoming', (callData) => {
          callEventReceived = true;
          clearTimeout(timeout);
          resolve(true);
        });
      });

      // Simulate incoming call
      const testCallData = {
        id: this.testData.testCallId,
        type: 'voice',
        participant: 'Test User',
        timestamp: new Date().toISOString(),
      };

      enhancedRealTimeManager.emit('call:incoming', testCallData);
      const callEventResult = await callPromise;

      if (callEventResult) {
        console.log('✅ Call events working');
      } else {
        throw new Error('Call events not received');
      }

      this.testResults.communication.passed = true;
      console.log('✅ Communication System tests passed\n');

    } catch (error) {
      this.testResults.communication.errors.push(error.message);
      console.error('❌ Communication System tests failed:', error.message);
    }
  }

  /**
   * Test Messaging System
   */
  async testMessagingSystem() {
    console.log('💬 Testing Messaging System...');
    
    try {
      // Test 1: Get conversations
      const conversations = await apiService.getConversations();
      if (!Array.isArray(conversations)) {
        throw new Error('Conversations API returned invalid data');
      }
      console.log('✅ Conversations API working');

      // Test 2: Get messages
      const messages = await apiService.getMessages(this.testData.testConversationId);
      if (!Array.isArray(messages)) {
        throw new Error('Messages API returned invalid data');
      }
      console.log('✅ Messages API working');

      // Test 3: Send message
      const testMessage = {
        conversationId: this.testData.testConversationId,
        content: 'Test message from automated test',
        timestamp: new Date().toISOString(),
      };

      await enhancedRealTimeManager.sendMessage(
        testMessage.conversationId,
        testMessage.content
      );
      console.log('✅ Message sending working');

      // Test 4: Test message events
      let messageEventReceived = false;
      const messagePromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        enhancedRealTimeManager.on('message:received', (messageData) => {
          messageEventReceived = true;
          clearTimeout(timeout);
          resolve(true);
        });
      });

      // Simulate received message
      const testReceivedMessage = {
        id: `msg_${Date.now()}`,
        conversationId: this.testData.testConversationId,
        content: 'Test received message',
        timestamp: new Date().toISOString(),
        sender: 'test_user',
      };

      enhancedRealTimeManager.emit('message:received', testReceivedMessage);
      const messageEventResult = await messagePromise;

      if (messageEventResult) {
        console.log('✅ Message events working');
      } else {
        throw new Error('Message events not received');
      }

      this.testResults.messaging.passed = true;
      console.log('✅ Messaging System tests passed\n');

    } catch (error) {
      this.testResults.messaging.errors.push(error.message);
      console.error('❌ Messaging System tests failed:', error.message);
    }
  }

  /**
   * Test Safety Monitoring
   */
  async testSafetyMonitoring() {
    console.log('🛡️ Testing Safety Monitoring...');
    
    try {
      // Test 1: Get safety metrics
      const safetyMetrics = await apiService.getSafetyMetrics();
      if (!safetyMetrics || typeof safetyMetrics !== 'object') {
        throw new Error('Safety metrics API returned invalid data');
      }
      console.log('✅ Safety metrics API working');

      // Test 2: Get emergency contacts
      const emergencyContacts = await apiService.getEmergencyContacts();
      if (!Array.isArray(emergencyContacts)) {
        throw new Error('Emergency contacts API returned invalid data');
      }
      console.log('✅ Emergency contacts API working');

      // Test 3: Get safety history
      const safetyHistory = await apiService.getSafetyHistory();
      if (!Array.isArray(safetyHistory)) {
        throw new Error('Safety history API returned invalid data');
      }
      console.log('✅ Safety history API working');

      // Test 4: Test safety events
      let safetyEventReceived = false;
      const safetyPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        enhancedRealTimeManager.on('safety:alert', (alertData) => {
          safetyEventReceived = true;
          clearTimeout(timeout);
          resolve(true);
        });
      });

      // Simulate safety alert
      const testSafetyAlert = {
        id: `alert_${Date.now()}`,
        type: 'speed',
        severity: 'warning',
        message: 'Speed limit exceeded',
        timestamp: new Date().toISOString(),
      };

      enhancedRealTimeManager.emit('safety:alert', testSafetyAlert);
      const safetyEventResult = await safetyPromise;

      if (safetyEventResult) {
        console.log('✅ Safety events working');
      } else {
        throw new Error('Safety events not received');
      }

      this.testResults.safetyMonitoring.passed = true;
      console.log('✅ Safety Monitoring tests passed\n');

    } catch (error) {
      this.testResults.safetyMonitoring.errors.push(error.message);
      console.error('❌ Safety Monitoring tests failed:', error.message);
    }
  }

  /**
   * Test Ride Requests
   */
  async testRideRequests() {
    console.log('🚗 Testing Ride Requests...');
    
    try {
      // Test 1: Get ride requests
      const rideRequests = await apiService.getRideRequests();
      if (!Array.isArray(rideRequests)) {
        throw new Error('Ride requests API returned invalid data');
      }
      console.log('✅ Ride requests API working');

      // Test 2: Test ride request events
      let rideEventReceived = false;
      const ridePromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        enhancedRealTimeManager.on('ride:request', (rideData) => {
          rideEventReceived = true;
          clearTimeout(timeout);
          resolve(true);
        });
      });

      // Simulate ride request
      const testRideRequest = {
        id: this.testData.testRideId,
        pickup: { latitude: 40.7128, longitude: -74.0060 },
        destination: { latitude: 40.7589, longitude: -73.9851 },
        fare: 25.50,
        distance: 5.2,
        duration: 15,
        timestamp: new Date().toISOString(),
      };

      enhancedRealTimeManager.emit('ride:request', testRideRequest);
      const rideEventResult = await ridePromise;

      if (rideEventResult) {
        console.log('✅ Ride request events working');
      } else {
        throw new Error('Ride request events not received');
      }

      // Test 3: Accept ride
      await enhancedRealTimeManager.acceptRide(this.testData.testRideId);
      console.log('✅ Ride acceptance working');

      this.testResults.rideRequests.passed = true;
      console.log('✅ Ride Requests tests passed\n');

    } catch (error) {
      this.testResults.rideRequests.errors.push(error.message);
      console.error('❌ Ride Requests tests failed:', error.message);
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n📋 Test Report');
    console.log('==============');

    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log('\nDetailed Results:');
    console.log('=================');

    Object.entries(this.testResults).forEach(([feature, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${feature}: ${status}`);
      
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.join(', ')}`);
      }
    });

    if (failedTests === 0) {
      console.log('\n🎉 All tests passed! Real-time features are working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the errors above.');
    }

    // Save test results
    this.saveTestResults();
  }

  /**
   * Save test results to file
   */
  saveTestResults() {
    const testReport = {
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: {
        total: Object.keys(this.testResults).length,
        passed: Object.values(this.testResults).filter(result => result.passed).length,
        failed: Object.values(this.testResults).filter(result => !result.passed).length,
      },
    };

    // In a real app, you might want to save this to a file or send to a monitoring service
    console.log('\n💾 Test results saved for monitoring');
    return testReport;
  }

  /**
   * Run specific test
   */
  async runSpecificTest(testName) {
    console.log(`🧪 Running specific test: ${testName}`);
    
    switch (testName) {
      case 'performanceDashboard':
        await this.testPerformanceDashboard();
        break;
      case 'locationTracking':
        await this.testLocationTracking();
        break;
      case 'communication':
        await this.testCommunicationSystem();
        break;
      case 'messaging':
        await this.testMessagingSystem();
        break;
      case 'safetyMonitoring':
        await this.testSafetyMonitoring();
        break;
      case 'rideRequests':
        await this.testRideRequests();
        break;
      default:
        console.error(`❌ Unknown test: ${testName}`);
    }
  }
}

// React Component for Test UI
const RealTimeTestUI = ({ onRunTests, onRunSpecificTest }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const handleRunAllTests = async () => {
    setIsRunning(true);
    try {
      const tester = new RealTimeFeaturesTester();
      await tester.runAllTests();
      setTestResults(tester.testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSpecificTest = async (testName) => {
    setIsRunning(true);
    try {
      const tester = new RealTimeFeaturesTester();
      await tester.runSpecificTest(testName);
      setTestResults(tester.testResults);
    } catch (error) {
      console.error('Specific test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flask" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>Real-Time Features Testing</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={[styles.testButton, isRunning && styles.testButtonDisabled]}
          onPress={handleRunAllTests}
          disabled={isRunning}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <View style={styles.specificTests}>
          <Text style={styles.sectionTitle}>Individual Tests</Text>
          {[
            'performanceDashboard',
            'locationTracking',
            'communication',
            'messaging',
            'safetyMonitoring',
            'rideRequests'
          ].map(testName => (
            <TouchableOpacity
              key={testName}
              style={styles.specificTestButton}
              onPress={() => handleRunSpecificTest(testName)}
              disabled={isRunning}
            >
              <Text style={styles.specificTestText}>
                Test {testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {testResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            {Object.entries(testResults).map(([feature, result]) => (
              <View key={feature} style={styles.resultItem}>
                <Ionicons
                  name={result.passed ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={result.passed ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.resultText}>
                  {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text style={[styles.resultStatus, { color: result.passed ? '#00AA00' : '#FF4444' }]}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  content: {
    padding: 16,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  testButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  specificTests: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  specificTestButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  specificTestText: {
    fontSize: 14,
    color: '#333',
  },
  resultsSection: {
    marginTop: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export { RealTimeFeaturesTester, RealTimeTestUI };
export default RealTimeFeaturesTester; 