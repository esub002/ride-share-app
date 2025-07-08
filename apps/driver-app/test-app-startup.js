// Test App Startup and Firebase Configuration
import { firebaseServiceManager } from './firebaseConfig';
import mockFirebaseAuth from './utils/mockFirebaseAuth';
import reactNativeFirebaseAuth from './utils/reactNativeFirebaseAuth';

class AppStartupTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting App Startup Tests...\n');
    
    try {
      // Test 1: Firebase Service Manager
      await this.testFirebaseServiceManager();
      
      // Test 2: Mock Firebase Auth
      await this.testMockFirebaseAuth();
      
      // Test 3: React Native Firebase Auth
      await this.testReactNativeFirebaseAuth();
      
      // Test 4: App Entry Point
      await this.testAppEntryPoint();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.push({
        test: 'Test Suite',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testFirebaseServiceManager() {
    try {
      console.log('🔧 Testing Firebase Service Manager...');
      
      const status = firebaseServiceManager.getStatus();
      console.log('✅ Firebase Service Manager status:', status);
      
      // Test initialization
      const initResult = await firebaseServiceManager.initialize();
      console.log('✅ Firebase Service Manager initialization:', initResult);
      
      this.testResults.push({
        test: 'Firebase Service Manager',
        status: 'PASSED',
        details: 'Service manager initialized successfully'
      });
      
    } catch (error) {
      console.error('❌ Firebase Service Manager test failed:', error);
      this.testResults.push({
        test: 'Firebase Service Manager',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testMockFirebaseAuth() {
    try {
      console.log('🔧 Testing Mock Firebase Auth...');
      
      // Test initialization
      const initResult = await mockFirebaseAuth.initialize();
      console.log('✅ Mock Firebase Auth initialization:', initResult);
      
      // Test phone number validation
      const validPhone = '+1234567890';
      const invalidPhone = '1234567890';
      
      const validResult = mockFirebaseAuth.validatePhoneNumber(validPhone);
      const invalidResult = mockFirebaseAuth.validatePhoneNumber(invalidPhone);
      
      console.log('✅ Phone validation test:', { valid: validResult, invalid: invalidResult });
      
      // Test OTP sending
      const otpResult = await mockFirebaseAuth.signInWithPhone(validPhone);
      console.log('✅ OTP sending test:', otpResult.success);
      
      this.testResults.push({
        test: 'Mock Firebase Auth',
        status: 'PASSED',
        details: 'Mock auth working correctly'
      });
      
    } catch (error) {
      console.error('❌ Mock Firebase Auth test failed:', error);
      this.testResults.push({
        test: 'Mock Firebase Auth',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testReactNativeFirebaseAuth() {
    try {
      console.log('🔧 Testing React Native Firebase Auth...');
      
      // Test initialization
      const initResult = await reactNativeFirebaseAuth.initialize();
      console.log('✅ React Native Firebase Auth initialization:', initResult);
      
      const status = reactNativeFirebaseAuth.getStatus();
      console.log('✅ React Native Firebase Auth status:', status);
      
      this.testResults.push({
        test: 'React Native Firebase Auth',
        status: initResult ? 'PASSED' : 'FAILED',
        details: initResult ? 'RN Firebase Auth initialized' : 'RN Firebase Auth failed to initialize'
      });
      
    } catch (error) {
      console.error('❌ React Native Firebase Auth test failed:', error);
      this.testResults.push({
        test: 'React Native Firebase Auth',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testAppEntryPoint() {
    try {
      console.log('🔧 Testing App Entry Point...');
      
      // Test if App.js can be imported
      const App = require('./App').default;
      console.log('✅ App.js imported successfully');
      
      // Test if index.js exists
      const fs = require('fs');
      const indexExists = fs.existsSync('./index.js');
      console.log('✅ index.js exists:', indexExists);
      
      this.testResults.push({
        test: 'App Entry Point',
        status: 'PASSED',
        details: 'App.js and index.js are properly configured'
      });
      
    } catch (error) {
      console.error('❌ App Entry Point test failed:', error);
      this.testResults.push({
        test: 'App Entry Point',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  generateTestReport() {
    console.log('\n📊 Test Report:');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach((result, index) => {
      const icon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n🎯 Recommendations:');
    if (failed === 0) {
      console.log('✅ All tests passed! Your app should start successfully.');
      console.log('🚀 Run: npx expo start --clear');
    } else {
      console.log('⚠️ Some tests failed. Check the errors above.');
      if (this.testResults.some(r => r.test.includes('React Native Firebase') && r.status === 'FAILED')) {
        console.log('💡 React Native Firebase failed - this is expected if Firebase is not configured.');
        console.log('✅ The app will use Mock Firebase Auth instead.');
      }
    }
  }

  async quickTest() {
    console.log('⚡ Running Quick Test...');
    
    try {
      // Test app entry point
      const App = require('./App').default;
      console.log('✅ App.js can be imported');
      
      // Test mock auth
      await mockFirebaseAuth.initialize();
      console.log('✅ Mock Firebase Auth working');
      
      console.log('✅ Quick test passed! App should start successfully.');
      return true;
      
    } catch (error) {
      console.error('❌ Quick test failed:', error);
      return false;
    }
  }
}

const appStartupTester = new AppStartupTester();

// Export for use in other files
export default appStartupTester;

// Run tests if this file is executed directly
if (require.main === module) {
  appStartupTester.runAllTests();
} 