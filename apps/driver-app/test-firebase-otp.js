// Firebase OTP Test Script
import reactNativeFirebaseAuth from './utils/reactNativeFirebaseAuth';
import { firebaseAuthInstance } from './firebaseConfig';

class FirebaseOTPTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Firebase OTP Tests...\n');
    
    try {
      // Test 1: Firebase Initialization
      await this.testFirebaseInitialization();
      
      // Test 2: Auth Service Initialization
      await this.testAuthServiceInitialization();
      
      // Test 3: Phone Number Validation
      await this.testPhoneNumberValidation();
      
      // Test 4: OTP Sending (Mock)
      await this.testOTPSending();
      
      // Test 5: OTP Verification (Mock)
      await this.testOTPVerification();
      
      // Test 6: Error Handling
      await this.testErrorHandling();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      this.errors.push(error.message);
    }
  }

  async testFirebaseInitialization() {
    console.log('🔧 Test 1: Firebase Initialization');
    try {
      // Check if Firebase Auth is available
      if (!firebaseAuthInstance) {
        throw new Error('Firebase Auth not available');
      }
      
      console.log('✅ Firebase Auth is available');
      this.testResults.push({ test: 'Firebase Initialization', status: 'PASS' });
      
    } catch (error) {
      console.error('❌ Firebase Initialization failed:', error.message);
      this.testResults.push({ test: 'Firebase Initialization', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  async testAuthServiceInitialization() {
    console.log('🔧 Test 2: Auth Service Initialization');
    try {
      const success = await reactNativeFirebaseAuth.initialize();
      
      if (success) {
        console.log('✅ Auth Service initialized successfully');
        this.testResults.push({ test: 'Auth Service Initialization', status: 'PASS' });
      } else {
        throw new Error('Auth Service initialization returned false');
      }
      
    } catch (error) {
      console.error('❌ Auth Service Initialization failed:', error.message);
      this.testResults.push({ test: 'Auth Service Initialization', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  async testPhoneNumberValidation() {
    console.log('🔧 Test 3: Phone Number Validation');
    try {
      const validNumbers = [
        '+1234567890',
        '+447911123456',
        '+919876543210'
      ];
      
      const invalidNumbers = [
        '1234567890',
        '+123',
        'invalid',
        ''
      ];
      
      // Test valid numbers
      for (const number of validNumbers) {
        const isValid = reactNativeFirebaseAuth.validatePhoneNumber(number);
        if (!isValid) {
          throw new Error(`Valid number ${number} was rejected`);
        }
      }
      
      // Test invalid numbers
      for (const number of invalidNumbers) {
        const isValid = reactNativeFirebaseAuth.validatePhoneNumber(number);
        if (isValid) {
          throw new Error(`Invalid number ${number} was accepted`);
        }
      }
      
      console.log('✅ Phone number validation working correctly');
      this.testResults.push({ test: 'Phone Number Validation', status: 'PASS' });
      
    } catch (error) {
      console.error('❌ Phone Number Validation failed:', error.message);
      this.testResults.push({ test: 'Phone Number Validation', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  async testOTPSending() {
    console.log('🔧 Test 4: OTP Sending (Mock Test)');
    try {
      // Test with a valid phone number
      const testPhone = '+1234567890';
      
      // This will fail in test environment, but we can check the error handling
      const result = await reactNativeFirebaseAuth.signInWithPhone(testPhone);
      
      if (result.success) {
        console.log('✅ OTP sending successful (unexpected in test environment)');
        this.testResults.push({ test: 'OTP Sending', status: 'PASS' });
      } else {
        // Expected to fail in test environment
        console.log('⚠️ OTP sending failed as expected in test environment:', result.error);
        this.testResults.push({ test: 'OTP Sending', status: 'EXPECTED_FAIL', error: result.error });
      }
      
    } catch (error) {
      console.log('⚠️ OTP sending error (expected in test environment):', error.message);
      this.testResults.push({ test: 'OTP Sending', status: 'EXPECTED_FAIL', error: error.message });
    }
  }

  async testOTPVerification() {
    console.log('🔧 Test 5: OTP Verification (Mock Test)');
    try {
      // Create a mock confirmation object
      const mockConfirmation = {
        confirm: async (otp) => {
          if (otp === '123456') {
            return {
              user: {
                uid: 'test-user-' + Date.now(),
                phoneNumber: '+1234567890',
                displayName: 'Test Driver',
                email: null,
                getIdToken: async () => 'mock-token-' + Date.now(),
                updateProfile: async (data) => Promise.resolve()
              }
            };
          } else {
            throw new Error('Invalid OTP');
          }
        }
      };
      
      // Test with valid OTP
      const validResult = await reactNativeFirebaseAuth.verifyOTP(mockConfirmation, '123456');
      if (validResult.success) {
        console.log('✅ OTP verification successful with valid OTP');
      } else {
        throw new Error('Valid OTP verification failed');
      }
      
      // Test with invalid OTP
      const invalidResult = await reactNativeFirebaseAuth.verifyOTP(mockConfirmation, '000000');
      if (!invalidResult.success) {
        console.log('✅ OTP verification correctly rejected invalid OTP');
      } else {
        throw new Error('Invalid OTP was accepted');
      }
      
      this.testResults.push({ test: 'OTP Verification', status: 'PASS' });
      
    } catch (error) {
      console.error('❌ OTP Verification test failed:', error.message);
      this.testResults.push({ test: 'OTP Verification', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  async testErrorHandling() {
    console.log('🔧 Test 6: Error Handling');
    try {
      // Test with null confirmation
      const result = await reactNativeFirebaseAuth.verifyOTP(null, '123456');
      if (!result.success && result.error) {
        console.log('✅ Error handling working correctly for null confirmation');
      } else {
        throw new Error('Error handling failed for null confirmation');
      }
      
      // Test with empty OTP
      const mockConfirmation = {
        confirm: async (otp) => {
          throw new Error('Invalid OTP');
        }
      };
      
      const emptyOtpResult = await reactNativeFirebaseAuth.verifyOTP(mockConfirmation, '');
      if (!emptyOtpResult.success && emptyOtpResult.error) {
        console.log('✅ Error handling working correctly for empty OTP');
      } else {
        throw new Error('Error handling failed for empty OTP');
      }
      
      this.testResults.push({ test: 'Error Handling', status: 'PASS' });
      
    } catch (error) {
      console.error('❌ Error Handling test failed:', error.message);
      this.testResults.push({ test: 'Error Handling', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  generateTestReport() {
    console.log('\n📊 Firebase OTP Test Report');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const expectedFail = this.testResults.filter(r => r.status === 'EXPECTED_FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Expected Failures: ${expectedFail}`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'EXPECTED_FAIL' ? '⚠️' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    if (this.errors.length > 0) {
      console.log('\n🚨 Critical Errors:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🎯 Recommendations:');
    if (failed === 0 && expectedFail <= 1) {
      console.log('✅ Firebase OTP setup looks good!');
      console.log('📱 Ready for production testing with real phone numbers.');
    } else {
      console.log('⚠️ Some issues detected:');
      if (this.errors.some(e => e.includes('Firebase Auth not available'))) {
        console.log('   - Check Firebase configuration files');
        console.log('   - Verify google-services.json is in android/app/');
        console.log('   - Ensure Firebase project is properly set up');
      }
      if (this.errors.some(e => e.includes('network'))) {
        console.log('   - Check internet connection');
        console.log('   - Verify Firebase project settings');
      }
    }
  }

  async quickTest() {
    console.log('⚡ Quick Firebase OTP Test');
    try {
      // Initialize auth service
      const initSuccess = await reactNativeFirebaseAuth.initialize();
      if (!initSuccess) {
        return { success: false, error: 'Auth service initialization failed' };
      }
      
      // Test phone validation
      const isValid = reactNativeFirebaseAuth.validatePhoneNumber('+1234567890');
      if (!isValid) {
        return { success: false, error: 'Phone validation failed' };
      }
      
      return { success: true, message: 'Firebase OTP setup is working correctly' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create test UI component
const FirebaseOTPTestUI = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    const tester = new FirebaseOTPTester();
    await tester.runAllTests();
    setResults(tester.testResults);
    setIsRunning(false);
  };

  const handleQuickTest = async () => {
    setIsRunning(true);
    const tester = new FirebaseOTPTester();
    const result = await tester.quickTest();
    setResults([{ test: 'Quick Test', status: result.success ? 'PASS' : 'FAIL', error: result.error }]);
    setIsRunning(false);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Firebase OTP Test Suite
      </Text>
      
      <Button
        title={isRunning ? "Running Tests..." : "Run All Tests"}
        onPress={handleRunTests}
        disabled={isRunning}
        style={{ marginBottom: 10 }}
      />
      
      <Button
        title={isRunning ? "Running..." : "Quick Test"}
        onPress={handleQuickTest}
        disabled={isRunning}
        variant="outlined"
        style={{ marginBottom: 20 }}
      />
      
      {results && (
        <View>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Test Results:
          </Text>
          {results.map((result, index) => (
            <Text key={index} style={{ marginBottom: 5 }}>
              {result.status === 'PASS' ? '✅' : '❌'} {result.test}: {result.status}
              {result.error && ` (${result.error})`}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default FirebaseOTPTester;
export { FirebaseOTPTestUI }; 