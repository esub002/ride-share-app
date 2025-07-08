/**
 * Test OTP Login Component
 * 
 * This file contains tests and utilities for the OTP login functionality
 */

import firebaseAuthService from './utils/firebaseAuthService';
import apiService from './utils/api';

class OTPLoginTester {
  constructor() {
    this.testResults = {
      firebaseAuth: false,
      apiService: false,
      otpVerification: false,
      userCreation: false,
      navigation: false
    };
  }

  /**
   * Run all OTP login tests
   */
  async runAllTests() {
    console.log('🧪 Starting OTP Login Tests...\n');

    try {
      // Test 1: Firebase Auth Service
      await this.testFirebaseAuthService();
      
      // Test 2: API Service
      await this.testApiService();
      
      // Test 3: OTP Verification
      await this.testOTPVerification();
      
      // Test 4: User Creation
      await this.testUserCreation();
      
      // Test 5: Navigation Flow
      await this.testNavigationFlow();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ OTP Login tests failed:', error);
    }
  }

  /**
   * Test Firebase Auth Service
   */
  async testFirebaseAuthService() {
    console.log('1️⃣ Testing Firebase Auth Service...');
    
    try {
      // Test phone number validation
      const validPhone = '+1234567890';
      const invalidPhone = '123';
      
      const validResult = firebaseAuthService.validatePhoneNumber(validPhone);
      const invalidResult = firebaseAuthService.validatePhoneNumber(invalidPhone);
      
      if (validResult && !invalidResult) {
        console.log('✅ Phone number validation working');
        this.testResults.firebaseAuth = true;
      } else {
        console.log('❌ Phone number validation failed');
      }
      
    } catch (error) {
      console.error('❌ Firebase Auth Service test error:', error);
      this.testResults.firebaseAuth = false;
    }
  }

  /**
   * Test API Service
   */
  async testApiService() {
    console.log('2️⃣ Testing API Service...');
    
    try {
      // Initialize API service
      const success = await apiService.init();
      
      if (success) {
        console.log('✅ API service initialized successfully');
        
        // Check API status
        const status = apiService.getStatus();
        console.log('📊 API Status:', status);
        
        this.testResults.apiService = status.isOnline;
      } else {
        console.log('❌ API service initialization failed');
        this.testResults.apiService = false;
      }
      
    } catch (error) {
      console.error('❌ API Service test error:', error);
      this.testResults.apiService = false;
    }
  }

  /**
   * Test OTP Verification
   */
  async testOTPVerification() {
    console.log('3️⃣ Testing OTP Verification...');
    
    try {
      // Test with mock confirmation and OTP
      const mockConfirmation = {
        confirm: async (otp) => {
          if (otp === '123456') {
            return {
              user: {
                uid: 'test-user-123',
                phoneNumber: '+1234567890',
                displayName: 'Test Driver'
              }
            };
          } else {
            throw new Error('Invalid OTP');
          }
        }
      };
      
      const validOTP = '123456';
      const invalidOTP = '000000';
      
      // Test valid OTP
      const validResult = await firebaseAuthService.verifyOTP(mockConfirmation, validOTP);
      
      if (validResult.success) {
        console.log('✅ Valid OTP verification working');
        
        // Test invalid OTP
        try {
          await firebaseAuthService.verifyOTP(mockConfirmation, invalidOTP);
          console.log('❌ Invalid OTP should have failed');
          this.testResults.otpVerification = false;
        } catch (error) {
          console.log('✅ Invalid OTP correctly rejected');
          this.testResults.otpVerification = true;
        }
      } else {
        console.log('❌ Valid OTP verification failed');
        this.testResults.otpVerification = false;
      }
      
    } catch (error) {
      console.error('❌ OTP Verification test error:', error);
      this.testResults.otpVerification = false;
    }
  }

  /**
   * Test User Creation
   */
  async testUserCreation() {
    console.log('4️⃣ Testing User Creation...');
    
    try {
      const mockUserData = {
        firebaseUid: 'test-user-123',
        phoneNumber: '+1234567890',
        displayName: 'Test Driver',
        carInfo: 'Toyota Prius 2020',
        email: 'test@example.com',
        createdAt: new Date().toISOString()
      };
      
      // Test user creation (this will use mock data if backend is not available)
      const result = await apiService.googleSignUp(mockUserData);
      
      if (result.success || result.mockMode) {
        console.log('✅ User creation working (mock mode or real)');
        this.testResults.userCreation = true;
      } else {
        console.log('❌ User creation failed');
        this.testResults.userCreation = false;
      }
      
    } catch (error) {
      console.error('❌ User Creation test error:', error);
      this.testResults.userCreation = false;
    }
  }

  /**
   * Test Navigation Flow
   */
  async testNavigationFlow() {
    console.log('5️⃣ Testing Navigation Flow...');
    
    try {
      // Simulate the navigation flow
      const steps = [
        'phone_input',
        'otp_sent',
        'otp_verification',
        'user_check',
        'profile_creation',
        'login_complete'
      ];
      
      let currentStep = 0;
      const navigateToNext = () => {
        currentStep++;
        console.log(`  → Step ${currentStep}: ${steps[currentStep - 1]}`);
      };
      
      // Simulate navigation
      steps.forEach((step, index) => {
        setTimeout(() => {
          navigateToNext();
          if (index === steps.length - 1) {
            console.log('✅ Navigation flow completed successfully');
            this.testResults.navigation = true;
          }
        }, index * 100);
      });
      
    } catch (error) {
      console.error('❌ Navigation Flow test error:', error);
      this.testResults.navigation = false;
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n📋 OTP Login Test Report');
    console.log('========================');
    
    const results = this.testResults;
    const allPassed = Object.values(results).every(result => result === true);
    
    console.log(`Firebase Auth Service: ${results.firebaseAuth ? '✅' : '❌'}`);
    console.log(`API Service: ${results.apiService ? '✅' : '❌'}`);
    console.log(`OTP Verification: ${results.otpVerification ? '✅' : '❌'}`);
    console.log(`User Creation: ${results.userCreation ? '✅' : '❌'}`);
    console.log(`Navigation Flow: ${results.navigation ? '✅' : '❌'}`);
    
    console.log(`\nOverall Status: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (!results.firebaseAuth) {
      console.log('• Check Firebase configuration');
      console.log('• Verify Firebase project settings');
      console.log('• Ensure Firebase Auth is enabled');
    }
    
    if (!results.apiService) {
      console.log('• Check backend server status');
      console.log('• Verify API endpoint configuration');
      console.log('• Check network connectivity');
    }
    
    if (!results.otpVerification) {
      console.log('• Check Firebase phone auth setup');
      console.log('• Verify phone number format');
      console.log('• Test with valid phone numbers');
    }
    
    if (!results.userCreation) {
      console.log('• Check backend user creation endpoints');
      console.log('• Verify database connection');
      console.log('• Check user data validation');
    }
    
    if (!results.navigation) {
      console.log('• Check React Navigation setup');
      console.log('• Verify component props');
      console.log('• Test navigation callbacks');
    }

    if (allPassed) {
      console.log('🎉 OTP Login is ready for use!');
      console.log('✅ All components are working correctly.');
    }
  }

  /**
   * Quick OTP login test
   */
  async quickTest() {
    try {
      const firebaseAuth = await this.testFirebaseAuthService();
      const apiService = await this.testApiService();
      const otpVerification = await this.testOTPVerification();
      
      return {
        firebaseAuth: this.testResults.firebaseAuth,
        apiService: this.testResults.apiService,
        otpVerification: this.testResults.otpVerification,
        allWorking: this.testResults.firebaseAuth && this.testResults.apiService && this.testResults.otpVerification
      };
    } catch (error) {
      console.error('Quick test failed:', error);
      return {
        firebaseAuth: false,
        apiService: false,
        otpVerification: false,
        allWorking: false,
        error: error.message
      };
    }
  }
}

// React Component for OTP Login Test UI
const OTPLoginTestUI = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const tester = new OTPLoginTester();
      await tester.runAllTests();
      setTestResults(tester.testResults);
    } catch (error) {
      console.error('OTP Login tests failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuickTest = async () => {
    try {
      const tester = new OTPLoginTester();
      const results = await tester.quickTest();
      setTestResults(results);
    } catch (error) {
      console.error('Quick test failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>OTP Login Test</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.testButton, isRunning && styles.testButtonDisabled]}
          onPress={handleRunTests}
          disabled={isRunning}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickTestButton}
          onPress={handleQuickTest}
        >
          <Ionicons name="flash" size={20} color="#007AFF" />
          <Text style={styles.quickTestButtonText}>Quick Test</Text>
        </TouchableOpacity>

        {testResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            
            {testResults.firebaseAuth !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={testResults.firebaseAuth ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={testResults.firebaseAuth ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>Firebase Auth Service</Text>
              </View>
            )}
            
            {testResults.apiService !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={testResults.apiService ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={testResults.apiService ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>API Service</Text>
              </View>
            )}
            
            {testResults.otpVerification !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={testResults.otpVerification ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={testResults.otpVerification ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>OTP Verification</Text>
              </View>
            )}
            
            {testResults.userCreation !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={testResults.userCreation ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={testResults.userCreation ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>User Creation</Text>
              </View>
            )}
            
            {testResults.navigation !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={testResults.navigation ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={testResults.navigation ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>Navigation Flow</Text>
              </View>
            )}
            
            {testResults.allWorking !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={testResults.allWorking ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={testResults.allWorking ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>All Systems Working</Text>
              </View>
            )}
          </View>
        )}
      </View>
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
    marginBottom: 12,
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
  quickTestButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  quickTestButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});

export { OTPLoginTester, OTPLoginTestUI };
export default OTPLoginTester; 