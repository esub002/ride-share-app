/**
 * Firebase Setup Script
 * 
 * This script helps set up and test Firebase integration for the driver app.
 */

import firebaseServiceManager from './firebaseConfig';
import firebaseIntegration from './utils/firebaseIntegration';
import apiService from './utils/api';

class FirebaseSetup {
  constructor() {
    this.setupResults = {
      firebaseServices: false,
      firebaseIntegration: false,
      apiIntegration: false,
      permissions: false,
      networkConnectivity: false
    };
  }

  /**
   * Run complete Firebase setup
   */
  async runSetup() {
    console.log('🔥 Starting Firebase Setup...\n');

    try {
      // Step 1: Initialize Firebase services
      await this.initializeFirebaseServices();
      
      // Step 2: Test Firebase integration
      await this.testFirebaseIntegration();
      
      // Step 3: Test API integration
      await this.testApiIntegration();
      
      // Step 4: Test permissions
      await this.testPermissions();
      
      // Step 5: Test network connectivity
      await this.testNetworkConnectivity();
      
      // Generate setup report
      this.generateSetupReport();
      
    } catch (error) {
      console.error('❌ Firebase setup failed:', error);
    }
  }

  /**
   * Initialize Firebase services
   */
  async initializeFirebaseServices() {
    console.log('1️⃣ Initializing Firebase Services...');
    
    try {
      const success = await firebaseServiceManager.initialize();
      this.setupResults.firebaseServices = success;
      
      if (success) {
        console.log('✅ Firebase services initialized successfully');
        
        // Test individual services
        const auth = firebaseServiceManager.getAuth();
        const firestore = firebaseServiceManager.getFirestore();
        const messaging = firebaseServiceManager.getMessaging();
        const storage = firebaseServiceManager.getStorage();
        const analytics = firebaseServiceManager.getAnalytics();
        
        console.log('📊 Service Status:');
        console.log(`  Auth: ${auth ? '✅' : '❌'}`);
        console.log(`  Firestore: ${firestore ? '✅' : '❌'}`);
        console.log(`  Messaging: ${messaging ? '✅' : '❌'}`);
        console.log(`  Storage: ${storage ? '✅' : '❌'}`);
        console.log(`  Analytics: ${analytics ? '✅' : '❌'}`);
      } else {
        console.log('❌ Firebase services initialization failed');
      }
      
    } catch (error) {
      console.error('❌ Firebase services error:', error);
      this.setupResults.firebaseServices = false;
    }
  }

  /**
   * Test Firebase integration
   */
  async testFirebaseIntegration() {
    console.log('\n2️⃣ Testing Firebase Integration...');
    
    try {
      const success = await firebaseIntegration.initialize();
      this.setupResults.firebaseIntegration = success;
      
      if (success) {
        console.log('✅ Firebase integration initialized successfully');
        
        // Test integration features
        const status = firebaseIntegration.getStatus();
        console.log('📊 Integration Status:');
        console.log(`  Initialized: ${status.isInitialized ? '✅' : '❌'}`);
        console.log(`  Online: ${status.isOnline ? '✅' : '❌'}`);
        console.log(`  Sync Queue: ${status.syncQueueLength} items`);
        console.log(`  Auth: ${status.hasAuth ? '✅' : '❌'}`);
        console.log(`  Firestore: ${status.hasFirestore ? '✅' : '❌'}`);
        console.log(`  Messaging: ${status.hasMessaging ? '✅' : '❌'}`);
        console.log(`  Storage: ${status.hasStorage ? '✅' : '❌'}`);
        console.log(`  Analytics: ${status.hasAnalytics ? '✅' : '❌'}`);
      } else {
        console.log('❌ Firebase integration failed');
      }
      
    } catch (error) {
      console.error('❌ Firebase integration error:', error);
      this.setupResults.firebaseIntegration = false;
    }
  }

  /**
   * Test API integration
   */
  async testApiIntegration() {
    console.log('\n3️⃣ Testing API Integration...');
    
    try {
      // Initialize API service
      const apiSuccess = await apiService.init();
      this.setupResults.apiIntegration = apiSuccess;
      
      if (apiSuccess) {
        console.log('✅ API service initialized successfully');
        
        // Check API status
        const status = apiService.getStatus();
        console.log('📊 API Status:');
        console.log(`  Online: ${status.isOnline ? '✅' : '❌'}`);
        console.log(`  Has Token: ${status.hasToken ? '✅' : '❌'}`);
        console.log(`  Socket Connected: ${status.socketConnected ? '✅' : '❌'}`);
        console.log(`  Firebase Connected: ${status.firebaseConnected ? '✅' : '❌'}`);
        console.log(`  Mock Mode: ${status.mockMode ? '⚠️' : '✅'}`);
      } else {
        console.log('❌ API service initialization failed');
      }
      
    } catch (error) {
      console.error('❌ API integration error:', error);
      this.setupResults.apiIntegration = false;
    }
  }

  /**
   * Test permissions
   */
  async testPermissions() {
    console.log('\n4️⃣ Testing Permissions...');
    
    try {
      const permissions = [
        { name: 'Location', key: 'ACCESS_FINE_LOCATION' },
        { name: 'Camera', key: 'CAMERA' },
        { name: 'Microphone', key: 'RECORD_AUDIO' },
        { name: 'Notifications', key: 'POST_NOTIFICATIONS' },
        { name: 'Storage', key: 'READ_EXTERNAL_STORAGE' }
      ];

      let allPermissionsGranted = true;
      
      for (const permission of permissions) {
        try {
          const { check, request, PERMISSIONS, RESULTS } = await import('react-native-permissions');
          
          const permissionStatus = await check(
            Platform.OS === 'ios' 
              ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
              : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          );
          
          const isGranted = permissionStatus === RESULTS.GRANTED;
          console.log(`  ${permission.name}: ${isGranted ? '✅' : '❌'}`);
          
          if (!isGranted) {
            allPermissionsGranted = false;
          }
        } catch (error) {
          console.log(`  ${permission.name}: ⚠️ (Could not check)`);
          allPermissionsGranted = false;
        }
      }
      
      this.setupResults.permissions = allPermissionsGranted;
      
      if (allPermissionsGranted) {
        console.log('✅ All permissions granted');
      } else {
        console.log('⚠️ Some permissions not granted');
      }
      
    } catch (error) {
      console.error('❌ Permissions test error:', error);
      this.setupResults.permissions = false;
    }
  }

  /**
   * Test network connectivity
   */
  async testNetworkConnectivity() {
    console.log('\n5️⃣ Testing Network Connectivity...');
    
    try {
      const NetInfo = require('@react-native-community/netinfo');
      const state = await NetInfo.fetch();
      
      this.setupResults.networkConnectivity = state.isConnected && state.isInternetReachable;
      
      console.log('📊 Network Status:');
      console.log(`  Connected: ${state.isConnected ? '✅' : '❌'}`);
      console.log(`  Internet Reachable: ${state.isInternetReachable ? '✅' : '❌'}`);
      console.log(`  Type: ${state.type}`);
      console.log(`  Is WiFi: ${state.isWifi ? '✅' : '❌'}`);
      console.log(`  Is Cellular: ${state.isCellular ? '✅' : '❌'}`);
      
      if (this.setupResults.networkConnectivity) {
        console.log('✅ Network connectivity is good');
      } else {
        console.log('❌ Network connectivity issues detected');
      }
      
    } catch (error) {
      console.error('❌ Network test error:', error);
      this.setupResults.networkConnectivity = false;
    }
  }

  /**
   * Generate setup report
   */
  generateSetupReport() {
    console.log('\n📋 Firebase Setup Report');
    console.log('========================');
    
    const results = this.setupResults;
    const allPassed = Object.values(results).every(result => result === true);
    
    console.log(`Firebase Services: ${results.firebaseServices ? '✅' : '❌'}`);
    console.log(`Firebase Integration: ${results.firebaseIntegration ? '✅' : '❌'}`);
    console.log(`API Integration: ${results.apiIntegration ? '✅' : '❌'}`);
    console.log(`Permissions: ${results.permissions ? '✅' : '❌'}`);
    console.log(`Network Connectivity: ${results.networkConnectivity ? '✅' : '❌'}`);
    
    console.log(`\nOverall Status: ${allPassed ? '🎉 SUCCESS' : '⚠️ ISSUES DETECTED'}`);
    
    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (!results.firebaseServices) {
      console.log('• Check Firebase configuration in firebase.js');
      console.log('• Verify Firebase project settings');
      console.log('• Ensure all required Firebase SDKs are installed');
    }
    
    if (!results.firebaseIntegration) {
      console.log('• Check Firebase integration service');
      console.log('• Verify network connectivity to Firebase');
      console.log('• Check Firebase project permissions');
    }
    
    if (!results.apiIntegration) {
      console.log('• Check backend server status');
      console.log('• Verify API endpoint configuration');
      console.log('• Check network connectivity to backend');
    }
    
    if (!results.permissions) {
      console.log('• Request missing permissions from user');
      console.log('• Check app permissions in device settings');
      console.log('• Verify permission declarations in app.json');
    }
    
    if (!results.networkConnectivity) {
      console.log('• Check device network connection');
      console.log('• Verify WiFi/cellular connectivity');
      console.log('• Check firewall settings');
    }

    if (allPassed) {
      console.log('🎉 Firebase setup is complete and ready to use!');
      console.log('✅ You can now use all Firebase features in your driver app.');
    }
  }

  /**
   * Quick setup check
   */
  async quickCheck() {
    try {
      const firebaseSuccess = await firebaseServiceManager.initialize();
      const integrationSuccess = await firebaseIntegration.initialize();
      const apiSuccess = await apiService.init();
      
      return {
        firebaseReady: firebaseSuccess,
        integrationReady: integrationSuccess,
        apiReady: apiSuccess,
        allReady: firebaseSuccess && integrationSuccess && apiSuccess
      };
    } catch (error) {
      console.error('Quick check failed:', error);
      return {
        firebaseReady: false,
        integrationReady: false,
        apiReady: false,
        allReady: false,
        error: error.message
      };
    }
  }
}

// React Component for Firebase Setup UI
const FirebaseSetupUI = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [setupResults, setSetupResults] = useState(null);

  const handleRunSetup = async () => {
    setIsRunning(true);
    try {
      const setup = new FirebaseSetup();
      await setup.runSetup();
      setSetupResults(setup.setupResults);
    } catch (error) {
      console.error('Firebase setup failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuickCheck = async () => {
    try {
      const setup = new FirebaseSetup();
      const results = await setup.quickCheck();
      setSetupResults(results);
    } catch (error) {
      console.error('Quick check failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flame" size={24} color="#FF6B35" />
        <Text style={styles.headerTitle}>Firebase Setup</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.setupButton, isRunning && styles.setupButtonDisabled]}
          onPress={handleRunSetup}
          disabled={isRunning}
        >
          <Ionicons name="settings" size={20} color="#FFFFFF" />
          <Text style={styles.setupButtonText}>
            {isRunning ? 'Setting up...' : 'Run Complete Setup'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCheckButton}
          onPress={handleQuickCheck}
        >
          <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
          <Text style={styles.quickCheckButtonText}>Quick Check</Text>
        </TouchableOpacity>

        {setupResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Setup Results</Text>
            
            {setupResults.firebaseServices !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={setupResults.firebaseServices ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={setupResults.firebaseServices ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>Firebase Services</Text>
              </View>
            )}
            
            {setupResults.firebaseIntegration !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={setupResults.firebaseIntegration ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={setupResults.firebaseIntegration ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>Firebase Integration</Text>
              </View>
            )}
            
            {setupResults.apiIntegration !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={setupResults.apiIntegration ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={setupResults.apiIntegration ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>API Integration</Text>
              </View>
            )}
            
            {setupResults.permissions !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={setupResults.permissions ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={setupResults.permissions ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>Permissions</Text>
              </View>
            )}
            
            {setupResults.networkConnectivity !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={setupResults.networkConnectivity ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={setupResults.networkConnectivity ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>Network Connectivity</Text>
              </View>
            )}
            
            {setupResults.allReady !== undefined && (
              <View style={styles.statusItem}>
                <Ionicons
                  name={setupResults.allReady ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={setupResults.allReady ? '#00AA00' : '#FF4444'}
                />
                <Text style={styles.statusText}>All Systems Ready</Text>
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
  setupButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  setupButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickCheckButton: {
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
  quickCheckButtonText: {
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

export { FirebaseSetup, FirebaseSetupUI };
export default FirebaseSetup; 