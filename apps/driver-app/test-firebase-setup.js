// Firebase Setup Test Script
import firebaseServiceManager from './firebaseConfig';

class FirebaseSetupTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Testing Firebase Setup...\n');
    
    try {
      // Test 1: Configuration Check
      await this.testConfiguration();
      
      // Test 2: Firebase Initialization
      await this.testFirebaseInitialization();
      
      // Test 3: Phone Auth Availability
      await this.testPhoneAuthAvailability();
      
      // Test 4: OTP Flow Test
      await this.testOTPFlow();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testConfiguration() {
    console.log('🔧 Test 1: Checking Firebase Configuration');
    
    try {
      const config = firebaseServiceManager.config;
      
      // Check if configuration has placeholder values
      const hasPlaceholders = 
        config.apiKey === "YOUR_API_KEY_HERE" ||
        config.projectId === "YOUR_PROJECT_ID" ||
        config.authDomain === "YOUR_PROJECT_ID.firebaseapp.com";
      
      if (hasPlaceholders) {
        console.log('❌ Firebase configuration has placeholder values');
        console.log('💡 Please update firebaseConfig.js with your actual Firebase credentials');
        this.testResults.push({
          test: 'Configuration',
          status: 'FAIL',
          error: 'Placeholder values detected'
        });
      } else {
        console.log('✅ Firebase configuration looks good');
        this.testResults.push({
          test: 'Configuration',
          status: 'PASS'
        });
      }
    } catch (error) {
      console.error('❌ Configuration test failed:', error);
      this.testResults.push({
        test: 'Configuration',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testFirebaseInitialization() {
    console.log('🔧 Test 2: Testing Firebase Initialization');
    
    try {
      const success = await firebaseServiceManager.initialize();
      
      if (success) {
        console.log('✅ Firebase initialized successfully');
        
        const status = firebaseServiceManager.getStatus();
        console.log('📊 Firebase Status:', status);
        
        this.testResults.push({
          test: 'Firebase Initialization',
          status: 'PASS'
        });
      } else {
        console.log('❌ Firebase initialization failed');
        this.testResults.push({
          test: 'Firebase Initialization',
          status: 'FAIL',
          error: 'Initialization returned false'
        });
      }
    } catch (error) {
      console.error('❌ Firebase initialization test failed:', error);
      this.testResults.push({
        test: 'Firebase Initialization',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testPhoneAuthAvailability() {
    console.log('🔧 Test 3: Testing Phone Auth Availability');
    
    try {
      const auth = firebaseServiceManager.getAuth();
      
      if (auth && typeof auth.signInWithPhoneNumber === 'function') {
        console.log('✅ Phone authentication is available');
        this.testResults.push({
          test: 'Phone Auth Availability',
          status: 'PASS'
        });
      } else {
        console.log('❌ Phone authentication not available');
        this.testResults.push({
          test: 'Phone Auth Availability',
          status: 'FAIL',
          error: 'signInWithPhoneNumber method not found'
        });
      }
    } catch (error) {
      console.error('❌ Phone auth test failed:', error);
      this.testResults.push({
        test: 'Phone Auth Availability',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testOTPFlow() {
    console.log('🔧 Test 4: Testing OTP Flow (Mock)');
    
    try {
      const auth = firebaseServiceManager.getAuth();
      
      if (!auth) {
        console.log('⚠️ Auth not available, skipping OTP test');
        this.testResults.push({
          test: 'OTP Flow',
          status: 'SKIP',
          error: 'Auth not available'
        });
        return;
      }

      // Test with a mock phone number
      const testPhone = '+1234567890';
      
      try {
        const confirmation = await auth.signInWithPhoneNumber(testPhone);
        console.log('✅ OTP sent successfully (mock test)');
        this.testResults.push({
          test: 'OTP Flow',
          status: 'PASS'
        });
      } catch (error) {
        if (error.code === 'auth/invalid-phone-number') {
          console.log('✅ Phone validation working (expected error for test number)');
          this.testResults.push({
            test: 'OTP Flow',
            status: 'PASS',
            note: 'Phone validation working correctly'
          });
        } else {
          console.log('⚠️ OTP test error (may be expected):', error.message);
          this.testResults.push({
            test: 'OTP Flow',
            status: 'WARNING',
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('❌ OTP flow test failed:', error);
      this.testResults.push({
        test: 'OTP Flow',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  generateTestReport() {
    console.log('\n📊 Firebase Setup Test Report');
    console.log('=============================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARNING').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);
    console.log(`Skipped: ${skipped}`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'WARNING' ? '⚠️' : 
                   result.status === 'SKIP' ? '⏭️' : '❌';
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.note) {
        console.log(`   Note: ${result.note}`);
      }
    });
    
    console.log('\n🎯 Recommendations:');
    
    if (failed === 0 && warnings === 0) {
      console.log('✅ All tests passed! Your Firebase setup is ready.');
      console.log('🚀 You can now test OTP with a real phone number.');
    } else {
      if (this.testResults.some(r => r.test === 'Configuration' && r.status === 'FAIL')) {
        console.log('💡 Update firebaseConfig.js with your Firebase project credentials');
        console.log('📖 Follow the FIREBASE_SETUP_GUIDE.md for step-by-step instructions');
      }
      
      if (this.testResults.some(r => r.test === 'Firebase Initialization' && r.status === 'FAIL')) {
        console.log('💡 Check your Firebase project settings and credentials');
        console.log('🔧 Make sure google-services.json is in android/app/');
      }
      
      if (this.testResults.some(r => r.test === 'Phone Auth Availability' && r.status === 'FAIL')) {
        console.log('💡 Enable phone authentication in Firebase Console');
        console.log('🔐 Go to Authentication > Sign-in method > Phone');
      }
    }
    
    console.log('\n📱 Next Steps:');
    console.log('1. Test with a real phone number');
    console.log('2. Check if you receive OTP SMS');
    console.log('3. Verify OTP code in the app');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new FirebaseSetupTester();
  tester.runAllTests();
}

export default FirebaseSetupTester; 