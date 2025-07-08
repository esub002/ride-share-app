/**
 * Test OTP Login Fix
 * 
 * This script tests the fixed OTP login functionality
 */

import firebaseAuthService from './utils/firebaseAuthService';

class OTPLoginFixTester {
  constructor() {
    this.testResults = {
      serviceInitialization: false,
      phoneNumberValidation: false,
      mockOTPSending: false,
      mockOTPVerification: false,
      userCreation: false
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Testing OTP Login Fix...\n');

    try {
      // Test 1: Service Initialization
      await this.testServiceInitialization();
      
      // Test 2: Phone Number Validation
      await this.testPhoneNumberValidation();
      
      // Test 3: Mock OTP Sending
      await this.testMockOTPSending();
      
      // Test 4: Mock OTP Verification
      await this.testMockOTPVerification();
      
      // Test 5: User Creation
      await this.testUserCreation();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ OTP Login Fix tests failed:', error);
    }
  }

  /**
   * Test service initialization
   */
  async testServiceInitialization() {
    console.log('1️⃣ Testing Service Initialization...');
    
    try {
      // Check if the service is properly initialized
      if (firebaseAuthService && 
          typeof firebaseAuthService.signInWithPhone === 'function' &&
          typeof firebaseAuthService.verifyOTP === 'function') {
        console.log('✅ Firebase Auth Service initialized correctly');
        this.testResults.serviceInitialization = true;
      } else {
        console.log('❌ Firebase Auth Service initialization failed');
        this.testResults.serviceInitialization = false;
      }
    } catch (error) {
      console.error('❌ Service initialization test error:', error);
      this.testResults.serviceInitialization = false;
    }
  }

  /**
   * Test phone number validation
   */
  async testPhoneNumberValidation() {
    console.log('2️⃣ Testing Phone Number Validation...');
    
    try {
      const validPhone = '+1234567890';
      const invalidPhone = '123';
      
      const validResult = firebaseAuthService.validatePhoneNumber(validPhone);
      const invalidResult = firebaseAuthService.validatePhoneNumber(invalidPhone);
      
      if (validResult && !invalidResult) {
        console.log('✅ Phone number validation working');
        this.testResults.phoneNumberValidation = true;
      } else {
        console.log('❌ Phone number validation failed');
        this.testResults.phoneNumberValidation = false;
      }
    } catch (error) {
      console.error('❌ Phone number validation test error:', error);
      this.testResults.phoneNumberValidation = false;
    }
  }

  /**
   * Test mock OTP sending
   */
  async testMockOTPSending() {
    console.log('3️⃣ Testing Mock OTP Sending...');
    
    try {
      const phoneNumber = '+1234567890';
      const result = await firebaseAuthService.signInWithPhone(phoneNumber);
      
      if (result.success && result.confirmation) {
        console.log('✅ Mock OTP sending working');
        console.log('📱 Confirmation object received:', typeof result.confirmation);
        this.testResults.mockOTPSending = true;
        this.lastConfirmation = result.confirmation;
      } else {
        console.log('❌ Mock OTP sending failed:', result.error);
        this.testResults.mockOTPSending = false;
      }
    } catch (error) {
      console.error('❌ Mock OTP sending test error:', error);
      this.testResults.mockOTPSending = false;
    }
  }

  /**
   * Test mock OTP verification
   */
  async testMockOTPVerification() {
    console.log('4️⃣ Testing Mock OTP Verification...');
    
    try {
      if (!this.lastConfirmation) {
        console.log('⚠️ No confirmation object available, skipping test');
        this.testResults.mockOTPVerification = false;
        return;
      }
      
      const validOTP = '123456';
      const invalidOTP = '000000';
      
      // Test valid OTP
      const validResult = await firebaseAuthService.verifyOTP(this.lastConfirmation, validOTP);
      
      if (validResult.success && validResult.user) {
        console.log('✅ Valid OTP verification working');
        console.log('👤 User created:', validResult.user.uid);
        
        // Test invalid OTP
        try {
          await firebaseAuthService.verifyOTP(this.lastConfirmation, invalidOTP);
          console.log('❌ Invalid OTP should have failed');
          this.testResults.mockOTPVerification = false;
        } catch (error) {
          console.log('✅ Invalid OTP correctly rejected');
          this.testResults.mockOTPVerification = true;
        }
      } else {
        console.log('❌ Valid OTP verification failed:', validResult.error);
        this.testResults.mockOTPVerification = false;
      }
    } catch (error) {
      console.error('❌ Mock OTP verification test error:', error);
      this.testResults.mockOTPVerification = false;
    }
  }

  /**
   * Test user creation
   */
  async testUserCreation() {
    console.log('5️⃣ Testing User Creation...');
    
    try {
      // Test user creation flow
      const phoneNumber = '+1234567890';
      const otp = '123456';
      
      // Send OTP
      const sendResult = await firebaseAuthService.signInWithPhone(phoneNumber);
      
      if (sendResult.success) {
        // Verify OTP
        const verifyResult = await firebaseAuthService.verifyOTP(sendResult.confirmation, otp);
        
        if (verifyResult.success && verifyResult.user) {
          console.log('✅ User creation working');
          console.log('👤 User ID:', verifyResult.user.uid);
          console.log('📱 Phone:', verifyResult.user.phoneNumber);
          console.log('👨‍💼 Name:', verifyResult.user.displayName);
          
          this.testResults.userCreation = true;
        } else {
          console.log('❌ User creation failed:', verifyResult.error);
          this.testResults.userCreation = false;
        }
      } else {
        console.log('❌ User creation failed at OTP sending:', sendResult.error);
        this.testResults.userCreation = false;
      }
    } catch (error) {
      console.error('❌ User creation test error:', error);
      this.testResults.userCreation = false;
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n📋 OTP Login Fix Test Report');
    console.log('============================');
    
    const results = this.testResults;
    const allPassed = Object.values(results).every(result => result === true);
    
    console.log(`Service Initialization: ${results.serviceInitialization ? '✅' : '❌'}`);
    console.log(`Phone Number Validation: ${results.phoneNumberValidation ? '✅' : '❌'}`);
    console.log(`Mock OTP Sending: ${results.mockOTPSending ? '✅' : '❌'}`);
    console.log(`Mock OTP Verification: ${results.mockOTPVerification ? '✅' : '❌'}`);
    console.log(`User Creation: ${results.userCreation ? '✅' : '❌'}`);
    
    console.log(`\nOverall Status: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎉 OTP Login Fix is working correctly!');
      console.log('✅ You can now use the OTP login in your mobile app.');
      console.log('📱 The "this.auth is not a function" error has been resolved.');
    } else {
      console.log('\n💡 Recommendations:');
      
      if (!results.serviceInitialization) {
        console.log('• Check Firebase configuration');
        console.log('• Verify import statements');
      }
      
      if (!results.phoneNumberValidation) {
        console.log('• Check phone number validation logic');
      }
      
      if (!results.mockOTPSending) {
        console.log('• Check signInWithPhone method');
        console.log('• Verify React Native detection');
      }
      
      if (!results.mockOTPVerification) {
        console.log('• Check verifyOTP method');
        console.log('• Verify confirmation object structure');
      }
      
      if (!results.userCreation) {
        console.log('• Check complete user creation flow');
        console.log('• Verify user object structure');
      }
    }
  }

  /**
   * Quick test
   */
  async quickTest() {
    try {
      const phoneNumber = '+1234567890';
      const otp = '123456';
      
      // Test complete flow
      const sendResult = await firebaseAuthService.signInWithPhone(phoneNumber);
      
      if (sendResult.success) {
        const verifyResult = await firebaseAuthService.verifyOTP(sendResult.confirmation, otp);
        
        return {
          success: verifyResult.success,
          user: verifyResult.user,
          error: verifyResult.error
        };
      } else {
        return {
          success: false,
          error: sendResult.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in React Native
export { OTPLoginFixTester };

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment
  const tester = new OTPLoginFixTester();
  tester.runAllTests();
} else {
  // React Native environment
  console.log('🧪 OTP Login Fix Tester loaded for React Native');
}

export default OTPLoginFixTester; 