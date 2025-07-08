// Firebase OTP Setup Script
import { Platform } from 'react-native';
import reactNativeFirebaseAuth from './utils/reactNativeFirebaseAuth';
import { firebaseAuthInstance } from './firebaseConfig';

class FirebaseOTPSetup {
  constructor() {
    this.setupResults = [];
    this.errors = [];
  }

  async runSetup() {
    console.log('🔧 Starting Firebase OTP Setup...\n');
    
    try {
      // Step 1: Check Platform
      await this.checkPlatform();
      
      // Step 2: Check Firebase Configuration
      await this.checkFirebaseConfiguration();
      
      // Step 3: Check Dependencies
      await this.checkDependencies();
      
      // Step 4: Initialize Services
      await this.initializeServices();
      
      // Step 5: Test Basic Functionality
      await this.testBasicFunctionality();
      
      // Step 6: Generate Setup Report
      this.generateSetupReport();
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      this.errors.push(error.message);
    }
  }

  async checkPlatform() {
    console.log('🔧 Step 1: Checking Platform');
    try {
      console.log(`Platform: ${Platform.OS}`);
      console.log(`Version: ${Platform.Version}`);
      
      if (Platform.OS === 'android') {
        console.log('✅ Android platform detected');
        this.setupResults.push({ step: 'Platform Check', status: 'PASS', details: 'Android' });
      } else if (Platform.OS === 'ios') {
        console.log('✅ iOS platform detected');
        this.setupResults.push({ step: 'Platform Check', status: 'PASS', details: 'iOS' });
      } else {
        console.log('⚠️ Web platform detected - some features may not work');
        this.setupResults.push({ step: 'Platform Check', status: 'WARNING', details: 'Web' });
      }
      
    } catch (error) {
      console.error('❌ Platform check failed:', error.message);
      this.setupResults.push({ step: 'Platform Check', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  async checkFirebaseConfiguration() {
    console.log('🔧 Step 2: Checking Firebase Configuration');
    try {
      // Check if Firebase Auth is available
      if (!firebaseAuthInstance) {
        throw new Error('Firebase Auth not available');
      }
      
      console.log('✅ Firebase Auth is available');
      
      // Check if we can access Firebase methods
      if (typeof firebaseAuthInstance.signInWithPhoneNumber !== 'function') {
        throw new Error('Firebase phone authentication not available');
      }
      
      console.log('✅ Firebase phone authentication is available');
      this.setupResults.push({ step: 'Firebase Configuration', status: 'PASS' });
      
    } catch (error) {
      console.error('❌ Firebase configuration check failed:', error.message);
      this.setupResults.push({ step: 'Firebase Configuration', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  async checkDependencies() {
    console.log('🔧 Step 3: Checking Dependencies');
    try {
      const requiredDependencies = [
        '@react-native-firebase/app',
        '@react-native-firebase/auth',
        'react-native-phone-number-input'
      ];
      
      let allDependenciesAvailable = true;
      
      for (const dep of requiredDependencies) {
        try {
          require(dep);
          console.log(`✅ ${dep} is available`);
        } catch (error) {
          console.error(`❌ ${dep} is missing`);
          allDependenciesAvailable = false;
        }
      }
      
      if (allDependenciesAvailable) {
        this.setupResults.push({ step: 'Dependencies', status: 'PASS' });
      } else {
        throw new Error('Some required dependencies are missing');
      }
      
    } catch (error) {
      console.error('❌ Dependencies check failed:', error.message);
      this.setupResults.push({ step: 'Dependencies', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  async initializeServices() {
    console.log('🔧 Step 4: Initializing Services');
    try {
      // Initialize React Native Firebase Auth
      const success = await reactNativeFirebaseAuth.initialize();
      
      if (success) {
        console.log('✅ React Native Firebase Auth initialized successfully');
        this.setupResults.push({ step: 'Service Initialization', status: 'PASS' });
      } else {
        throw new Error('React Native Firebase Auth initialization failed');
      }
      
    } catch (error) {
      console.error('❌ Service initialization failed:', error.message);
      this.setupResults.push({ step: 'Service Initialization', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  async testBasicFunctionality() {
    console.log('🔧 Step 5: Testing Basic Functionality');
    try {
      // Test phone number validation
      const validNumbers = ['+1234567890', '+447911123456'];
      let validationPassed = true;
      
      for (const number of validNumbers) {
        const isValid = reactNativeFirebaseAuth.validatePhoneNumber(number);
        if (!isValid) {
          validationPassed = false;
          break;
        }
      }
      
      if (validationPassed) {
        console.log('✅ Phone number validation working');
        this.setupResults.push({ step: 'Basic Functionality', status: 'PASS' });
      } else {
        throw new Error('Phone number validation failed');
      }
      
    } catch (error) {
      console.error('❌ Basic functionality test failed:', error.message);
      this.setupResults.push({ step: 'Basic Functionality', status: 'FAIL', error: error.message });
      this.errors.push(error.message);
    }
  }

  generateSetupReport() {
    console.log('\n📊 Firebase OTP Setup Report');
    console.log('==========================');
    
    const passed = this.setupResults.filter(r => r.status === 'PASS').length;
    const failed = this.setupResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.setupResults.filter(r => r.status === 'WARNING').length;
    const total = this.setupResults.length;
    
    console.log(`Total Steps: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);
    
    console.log('\n📋 Detailed Results:');
    this.setupResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${index + 1}. ${status} ${result.step}: ${result.status}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    if (this.errors.length > 0) {
      console.log('\n🚨 Setup Issues:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('1. Check Firebase project configuration');
      console.log('2. Verify google-services.json is in android/app/');
      console.log('3. Ensure phone authentication is enabled in Firebase Console');
      console.log('4. Check SHA-1 fingerprint is added to Firebase project');
      console.log('5. Verify all dependencies are installed');
      console.log('6. Clean and rebuild the project');
    } else {
      console.log('\n✅ Setup completed successfully!');
      console.log('📱 Firebase OTP authentication is ready to use.');
    }
  }

  getSetupStatus() {
    const failed = this.setupResults.filter(r => r.status === 'FAIL').length;
    return {
      isReady: failed === 0,
      passed: this.setupResults.filter(r => r.status === 'PASS').length,
      failed: failed,
      warnings: this.setupResults.filter(r => r.status === 'WARNING').length,
      total: this.setupResults.length,
      errors: this.errors
    };
  }
}

// Create setup UI component
const FirebaseOTPSetupUI = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState(null);

  const handleRunSetup = async () => {
    setIsRunning(true);
    const setup = new FirebaseOTPSetup();
    await setup.runSetup();
    setResults(setup.setupResults);
    setStatus(setup.getSetupStatus());
    setIsRunning(false);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Firebase OTP Setup
      </Text>
      
      <Button
        title={isRunning ? "Running Setup..." : "Run Setup"}
        onPress={handleRunSetup}
        disabled={isRunning}
        style={{ marginBottom: 20 }}
      />
      
      {status && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Setup Status: {status.isReady ? '✅ Ready' : '❌ Issues Found'}
          </Text>
          <Text>Passed: {status.passed}/{status.total}</Text>
          <Text>Failed: {status.failed}</Text>
          <Text>Warnings: {status.warnings}</Text>
        </View>
      )}
      
      {results && (
        <View>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Setup Results:
          </Text>
          {results.map((result, index) => (
            <Text key={index} style={{ marginBottom: 5 }}>
              {result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'} {result.step}: {result.status}
              {result.details && ` (${result.details})`}
              {result.error && ` - ${result.error}`}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default FirebaseOTPSetup;
export { FirebaseOTPSetupUI }; 