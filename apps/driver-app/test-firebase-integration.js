/**
 * Test Firebase Integration
 * 
 * This script tests the Firebase integration to ensure it's working properly
 */

import firebaseServiceManager from './firebaseConfig';
import firebaseIntegration from './utils/firebaseIntegration';
import firebaseAuthService from './utils/firebaseAuthService';

class FirebaseIntegrationTester {
  constructor() {
    this.testResults = {
      serviceManager: false,
      authService: false,
      integration: false,
      phoneAuth: false,
      otpVerification: false
    };
  }

  /**
   * Run all Firebase integration tests
   */
  async runAllTests() {
    console.log('🧪 Testing Firebase Integration...\n');

    try {
      // Test 1: Firebase Service Manager
      await this.testServiceManager();
      
      // Test 2: Firebase Auth Service
      await this.testAuthService();
      
      // Test 3: Firebase Integration
      await this.testIntegration();
      
      // Test 4: Phone Authentication
      await this.testPhoneAuth();
      
      // Test 5: OTP Verification
      await this.testOTPVerification();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Firebase Integration tests failed:', error);
    }
  }

  /**
   * Test Firebase Service Manager
   */
  async testServiceManager() {
    console.log('1️⃣ Testing Firebase Service Manager...');
    
    try {
      const success = await firebaseServiceManager.initialize();
      this.testResults.serviceManager = success;
      
      if (success) {
        console.log('✅ Firebase Service Manager initialized successfully');
        
        // Check service status
        const status = firebaseServiceManager.getStatus();
        console.log('📊 Service Status:', status);
        
        // Test individual services
        const auth = firebaseServiceManager.getAuth();
        const firestore = firebaseServiceManager.getFirestore();
        const messaging = firebaseServiceManager.getMessaging();
        const storage = firebaseServiceManager.getStorage();
        const analytics = firebaseServiceManager.getAnalytics();
        
        console.log('📊 Individual Services:');
        console.log(`  Auth: ${auth ? '✅' : '❌'}`);
        console.log(`  Firestore: ${firestore ? '✅' : '❌'}`);
        console.log(`  Messaging: ${messaging ? '✅' : '❌'}`);
        console.log(`  Storage: ${storage ? '✅' : '❌'}`);
        console.log(`  Analytics: ${analytics ? '✅' : '❌'}`);
      } else {
        console.log('❌ Firebase Service Manager initialization failed');
      }
    } catch (error) {
      console.error('❌ Service Manager test error:', error);
      this.testResults.serviceManager = false;
    }
  }

  /**
   * Test Firebase Auth Service
   */
  async testAuthService() {
    console.log('2️⃣ Testing Firebase Auth Service...');
    
    try {
      const success = await firebaseAuthService.initialize();
      this.testResults.authService = success;
      
      if (success) {
        console.log('✅ Firebase Auth Service initialized successfully');
      } else {
        console.log('❌ Firebase Auth Service initialization failed');
      }
    } catch (error) {
      console.error('❌ Auth Service test error:', error);
      this.testResults.authService = false;
    }
  }

  /**
   * Test Firebase Integration
   */
  async testIntegration() {
    console.log('3️⃣ Testing Firebase Integration...');
    
    try {
      const success = await firebaseIntegration.initialize();
      this.testResults.integration = success;
      
      if (success) {
        console.log('✅ Firebase Integration initialized successfully');
        
        // Check integration status
        const status = firebaseIntegration.getStatus();
        console.log('📊 Integration Status:', status);
      } else {
        console.log('❌ Firebase Integration initialization failed');
      }
    } catch (error) {
      console.error('❌ Integration test error:', error);
      this.testResults.integration = false;
    }
  }

  /**
   * Test Phone Authentication
   */
  async testPhoneAuth() {
    console.log('4️⃣ Testing Phone Authentication...');
    
    try {
      const phoneNumber = '+1234567890';
      const result = await firebaseAuthService.signInWithPhone(phoneNumber);
      
      if (result.success && result.confirmation) {
        console.log('✅ Phone authentication working');
        this.testResults.phoneAuth = true;
        this.lastConfirmation = result.confirmation;
      } else {
        console.log('❌ Phone authentication failed:', result.error);
        this.testResults.phoneAuth = false;
      }
    } catch (error) {
      console.error('❌ Phone auth test error:', error);
      this.testResults.phoneAuth = false;
    }
  }

  /**
   * Test OTP Verification
   */
  async testOTPVerification() {
    console.log('5️⃣ Testing OTP Verification...');
    
    try {
      if (!this.lastConfirmation) {
        console.log('⚠️ No confirmation object available, skipping test');
        this.testResults.otpVerification = false;
        return;
      }
      
      const otp = '123456';
      const result = await firebaseAuthService.verifyOTP(this.lastConfirmation, otp);
      
      if (result.success && result.user) {
        console.log('✅ OTP verification working');
        console.log('👤 User created:', result.user.uid);
        this.testResults.otpVerification = true;
      } else {
        console.log('❌ OTP verification failed:', result.error);
        this.testResults.otpVerification = false;
      }
    } catch (error) {
      console.error('❌ OTP verification test error:', error);
      this.testResults.otpVerification = false;
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n📋 Firebase Integration Test Report');
    console.log('==================================');
    
    const results = this.testResults;
    const allPassed = Object.values(results).every(result => result === true);
    
    console.log(`Service Manager: ${results.serviceManager ? '✅' : '❌'}`);
    console.log(`Auth Service: ${results.authService ? '✅' : '❌'}`);
    console.log(`Integration: ${results.integration ? '✅' : '❌'}`);
    console.log(`Phone Auth: ${results.phoneAuth ? '✅' : '❌'}`);
    console.log(`OTP Verification: ${results.otpVerification ? '✅' : '❌'}`);
    
    console.log(`\nOverall Status: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎉 Firebase Integration is working correctly!');
      console.log('✅ You can now use Firebase features in your app.');
    } else {
      console.log('\n💡 Recommendations:');
      
      if (!results.serviceManager) {
        console.log('• Check Firebase configuration');
        console.log('• Verify Firebase project settings');
      }
      
      if (!results.authService) {
        console.log('• Check Firebase Auth setup');
        console.log('• Verify phone authentication is enabled');
      }
      
      if (!results.integration) {
        console.log('• Check Firebase integration service');
        console.log('• Verify network connectivity');
      }
      
      if (!results.phoneAuth) {
        console.log('• Check phone authentication configuration');
        console.log('• Verify phone number format');
      }
      
      if (!results.otpVerification) {
        console.log('• Check OTP verification logic');
        console.log('• Verify confirmation object structure');
      }
    }
  }

  /**
   * Quick test
   */
  async quickTest() {
    try {
      const serviceManager = await firebaseServiceManager.initialize();
      const integration = await firebaseIntegration.initialize();
      const phoneAuth = await firebaseAuthService.signInWithPhone('+1234567890');
      
      return {
        serviceManager,
        integration,
        phoneAuth: phoneAuth.success,
        allWorking: serviceManager && integration && phoneAuth.success
      };
    } catch (error) {
      console.error('Quick test failed:', error);
      return {
        serviceManager: false,
        integration: false,
        phoneAuth: false,
        allWorking: false,
        error: error.message
      };
    }
  }
}

// Export for use in React Native
export { FirebaseIntegrationTester };

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment
  const tester = new FirebaseIntegrationTester();
  tester.runAllTests();
} else {
  // React Native environment
  console.log('🧪 Firebase Integration Tester loaded for React Native');
}

export default FirebaseIntegrationTester; 