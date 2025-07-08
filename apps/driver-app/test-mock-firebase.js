// Test Mock Firebase Authentication
import mockFirebaseAuth from './utils/mockFirebaseAuth';

class MockFirebaseTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Mock Firebase Authentication Tests...\n');
    
    try {
      // Test 1: Initialization
      await this.testInitialization();
      
      // Test 2: Phone Number Validation
      await this.testPhoneNumberValidation();
      
      // Test 3: OTP Sending
      await this.testOTPSending();
      
      // Test 4: OTP Verification
      await this.testOTPVerification();
      
      // Test 5: User Management
      await this.testUserManagement();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testInitialization() {
    console.log('🔧 Test 1: Initialization');
    try {
      const result = await mockFirebaseAuth.initialize();
      const status = mockFirebaseAuth.getStatus();
      
      if (result && status.isInitialized) {
        console.log('✅ Initialization successful');
        this.testResults.push({ test: 'Initialization', status: 'PASS' });
      } else {
        console.log('❌ Initialization failed');
        this.testResults.push({ test: 'Initialization', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Initialization error:', error.message);
      this.testResults.push({ test: 'Initialization', status: 'ERROR' });
    }
    console.log('');
  }

  async testPhoneNumberValidation() {
    console.log('📱 Test 2: Phone Number Validation');
    try {
      const validNumbers = ['+1234567890', '+44123456789', '+61412345678'];
      const invalidNumbers = ['1234567890', '+', 'abc', ''];
      
      let allValid = true;
      
      // Test valid numbers
      for (const number of validNumbers) {
        const isValid = mockFirebaseAuth.validatePhoneNumber(number);
        if (!isValid) {
          console.log(`❌ Valid number failed: ${number}`);
          allValid = false;
        }
      }
      
      // Test invalid numbers
      for (const number of invalidNumbers) {
        const isValid = mockFirebaseAuth.validatePhoneNumber(number);
        if (isValid) {
          console.log(`❌ Invalid number passed: ${number}`);
          allValid = false;
        }
      }
      
      if (allValid) {
        console.log('✅ Phone number validation working correctly');
        this.testResults.push({ test: 'Phone Validation', status: 'PASS' });
      } else {
        console.log('❌ Phone number validation failed');
        this.testResults.push({ test: 'Phone Validation', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Phone validation error:', error.message);
      this.testResults.push({ test: 'Phone Validation', status: 'ERROR' });
    }
    console.log('');
  }

  async testOTPSending() {
    console.log('📤 Test 3: OTP Sending');
    try {
      const phoneNumber = '+1234567890';
      const result = await mockFirebaseAuth.signInWithPhone(phoneNumber);
      
      if (result.success && result.confirmation) {
        console.log('✅ OTP sending successful');
        console.log('📋 Confirmation object created');
        this.testResults.push({ test: 'OTP Sending', status: 'PASS' });
        return result.confirmation;
      } else {
        console.log('❌ OTP sending failed:', result.error);
        this.testResults.push({ test: 'OTP Sending', status: 'FAIL' });
        return null;
      }
    } catch (error) {
      console.log('❌ OTP sending error:', error.message);
      this.testResults.push({ test: 'OTP Sending', status: 'ERROR' });
      return null;
    }
  }

  async testOTPVerification() {
    console.log('🔐 Test 4: OTP Verification');
    try {
      // First send OTP
      const phoneNumber = '+1234567890';
      const sendResult = await mockFirebaseAuth.signInWithPhone(phoneNumber);
      
      if (!sendResult.success) {
        console.log('❌ Cannot test OTP verification - OTP sending failed');
        this.testResults.push({ test: 'OTP Verification', status: 'SKIP' });
        return;
      }
      
      // Test with correct OTP
      const correctOTP = '123456';
      const correctResult = await mockFirebaseAuth.verifyOTP(sendResult.confirmation, correctOTP);
      
      if (correctResult.success && correctResult.user) {
        console.log('✅ Correct OTP verification successful');
        console.log('👤 User created:', correctResult.user.uid);
      } else {
        console.log('❌ Correct OTP verification failed');
        this.testResults.push({ test: 'OTP Verification', status: 'FAIL' });
        return;
      }
      
      // Test with incorrect OTP
      const incorrectOTP = '000000';
      const incorrectResult = await mockFirebaseAuth.verifyOTP(sendResult.confirmation, incorrectOTP);
      
      if (!incorrectResult.success) {
        console.log('✅ Incorrect OTP properly rejected');
        this.testResults.push({ test: 'OTP Verification', status: 'PASS' });
      } else {
        console.log('❌ Incorrect OTP was accepted');
        this.testResults.push({ test: 'OTP Verification', status: 'FAIL' });
      }
      
    } catch (error) {
      console.log('❌ OTP verification error:', error.message);
      this.testResults.push({ test: 'OTP Verification', status: 'ERROR' });
    }
    console.log('');
  }

  async testUserManagement() {
    console.log('👤 Test 5: User Management');
    try {
      // Test sign out
      mockFirebaseAuth.signOut();
      const signedOut = !mockFirebaseAuth.isSignedIn();
      
      if (signedOut) {
        console.log('✅ Sign out successful');
      } else {
        console.log('❌ Sign out failed');
        this.testResults.push({ test: 'User Management', status: 'FAIL' });
        return;
      }
      
      // Test auth state listener
      const listener = mockFirebaseAuth.onAuthStateChanged(() => {});
      if (listener) {
        console.log('✅ Auth state listener working');
      } else {
        console.log('❌ Auth state listener failed');
        this.testResults.push({ test: 'User Management', status: 'FAIL' });
        return;
      }
      
      console.log('✅ User management working correctly');
      this.testResults.push({ test: 'User Management', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ User management error:', error.message);
      this.testResults.push({ test: 'User Management', status: 'ERROR' });
    }
    console.log('');
  }

  generateTestReport() {
    console.log('📊 Test Report');
    console.log('==============');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : 
                    result.status === 'ERROR' ? '⚠️' : '⏭️';
      console.log(`${status} ${result.test}: ${result.status}`);
    });
    
    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Errors: ${errors}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (failed === 0 && errors === 0) {
      console.log('\n🎉 All tests passed! Mock Firebase Auth is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the implementation.');
    }
  }

  async quickTest() {
    console.log('⚡ Quick Test: Mock Firebase Auth');
    try {
      // Initialize
      await mockFirebaseAuth.initialize();
      
      // Send OTP
      const sendResult = await mockFirebaseAuth.signInWithPhone('+1234567890');
      
      if (sendResult.success) {
        // Verify OTP
        const verifyResult = await mockFirebaseAuth.verifyOTP(sendResult.confirmation, '123456');
        
        if (verifyResult.success) {
          console.log('✅ Quick test passed! Mock Firebase Auth is working.');
          return true;
        } else {
          console.log('❌ OTP verification failed');
          return false;
        }
      } else {
        console.log('❌ OTP sending failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Quick test failed:', error.message);
      return false;
    }
  }
}

// Export for use in other files
const mockFirebaseTester = new MockFirebaseTester();
export default mockFirebaseTester;

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.mockFirebaseTester = mockFirebaseTester;
} else {
  // Node.js environment
  module.exports = mockFirebaseTester;
} 