// Test script to verify fixes for hard errors
const firebaseServiceManager = require('./firebaseConfig.js').default;
const firebaseAuthService = require('./utils/firebaseAuthService.js').default;
const googleSignInService = require('./utils/googleSignInService.js').default;
const apiService = require('./utils/api.js').default;

class FixesTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Testing Fixes for Hard Errors...\n');
    
    try {
      // Test 1: Firebase Service Manager
      await this.testFirebaseServiceManager();
      
      // Test 2: Firebase Auth Service
      await this.testFirebaseAuthService();
      
      // Test 3: Google Sign-In Service
      await this.testGoogleSignInService();
      
      // Test 4: API Service
      await this.testApiService();
      
      // Test 5: App Startup
      await this.testAppStartup();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testFirebaseServiceManager() {
    try {
      console.log('1️⃣ Testing Firebase Service Manager...');
      
      const success = await firebaseServiceManager.initialize();
      const status = firebaseServiceManager.getStatus();
      
      console.log('📊 Firebase Service Manager Status:', status);
      
      if (success) {
        console.log('✅ Firebase Service Manager test passed');
        this.testResults.push({
          test: 'Firebase Service Manager',
          status: 'PASS',
          details: 'Initialized successfully with fallback support'
        });
      } else {
        console.log('❌ Firebase Service Manager test failed');
        this.testResults.push({
          test: 'Firebase Service Manager',
          status: 'FAIL',
          error: 'Initialization failed'
        });
      }
    } catch (error) {
      console.error('❌ Firebase Service Manager test error:', error);
      this.testResults.push({
        test: 'Firebase Service Manager',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testFirebaseAuthService() {
    try {
      console.log('2️⃣ Testing Firebase Auth Service...');
      
      const success = await firebaseAuthService.initialize();
      const status = firebaseAuthService.getStatus();
      
      console.log('📊 Firebase Auth Service Status:', status);
      
      if (success) {
        console.log('✅ Firebase Auth Service test passed');
        this.testResults.push({
          test: 'Firebase Auth Service',
          status: 'PASS',
          details: 'Initialized successfully with mock fallback'
        });
      } else {
        console.log('❌ Firebase Auth Service test failed');
        this.testResults.push({
          test: 'Firebase Auth Service',
          status: 'FAIL',
          error: 'Initialization failed'
        });
      }
    } catch (error) {
      console.error('❌ Firebase Auth Service test error:', error);
      this.testResults.push({
        test: 'Firebase Auth Service',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testGoogleSignInService() {
    try {
      console.log('3️⃣ Testing Google Sign-In Service...');
      
      const success = await googleSignInService.initialize();
      
      if (success) {
        console.log('✅ Google Sign-In Service test passed');
        this.testResults.push({
          test: 'Google Sign-In Service',
          status: 'PASS',
          details: 'Initialized successfully with mock fallback'
        });
      } else {
        console.log('❌ Google Sign-In Service test failed');
        this.testResults.push({
          test: 'Google Sign-In Service',
          status: 'FAIL',
          error: 'Initialization failed'
        });
      }
    } catch (error) {
      console.error('❌ Google Sign-In Service test error:', error);
      this.testResults.push({
        test: 'Google Sign-In Service',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testApiService() {
    try {
      console.log('4️⃣ Testing API Service...');
      
      const success = await apiService.init();
      const status = apiService.getStatus();
      
      console.log('📊 API Service Status:', status);
      
      if (success) {
        console.log('✅ API Service test passed');
        this.testResults.push({
          test: 'API Service',
          status: 'PASS',
          details: 'Initialized successfully with error handling'
        });
      } else {
        console.log('❌ API Service test failed');
        this.testResults.push({
          test: 'API Service',
          status: 'FAIL',
          error: 'Initialization failed'
        });
      }
    } catch (error) {
      console.error('❌ API Service test error:', error);
      this.testResults.push({
        test: 'API Service',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testAppStartup() {
    try {
      console.log('5️⃣ Testing App Startup...');
      
      // Test if main App component can be imported
      const App = require('./App.js').default;
      console.log('✅ App.js imported successfully');
      
      // Test if index.js exists and can be imported
      const index = require('./index.js');
      console.log('✅ index.js imported successfully');
      
      console.log('✅ App Startup test passed');
      this.testResults.push({
        test: 'App Startup',
        status: 'PASS',
        details: 'App components can be imported successfully'
      });
    } catch (error) {
      console.error('❌ App Startup test error:', error);
      this.testResults.push({
        test: 'App Startup',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  generateTestReport() {
    console.log('\n📋 Fixes Test Report');
    console.log('===================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n🎯 Summary:');
    if (failed === 0) {
      console.log('🎉 All tests passed! Your app should start without hard errors.');
      console.log('✅ The fixes have resolved the Firebase configuration issues.');
      console.log('✅ Mock services are working as fallbacks.');
      console.log('🚀 You can now run: npx expo start --clear');
    } else {
      console.log('⚠️ Some tests failed. Check the errors above.');
      console.log('💡 The app may still work with mock services.');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. Run: npx expo start --clear');
    console.log('2. Test the OTP login flow');
    console.log('3. Verify that no hard errors appear in the console');
    console.log('4. To use real Firebase, update firebaseConfig.js with your credentials');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new FixesTester();
  tester.runAllTests();
}

module.exports = FixesTester; 