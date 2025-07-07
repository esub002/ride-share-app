/**
 * Backend Connection Test Script
 * 
 * This script helps verify that the driver app is properly connecting to the real backend
 * instead of using mock data.
 */

import apiService from './utils/api';

class BackendConnectionTester {
  constructor() {
    this.testResults = {
      mockModeDisabled: false,
      backendReachable: false,
      apiEndpoints: {},
      socketConnection: false,
    };
  }

  /**
   * Run all connection tests
   */
  async runConnectionTests() {
    console.log('🔍 Testing Backend Connection...\n');

    try {
      // Test 1: Check if mock mode is disabled
      await this.testMockModeDisabled();
      
      // Test 2: Test backend connectivity
      await this.testBackendConnectivity();
      
      // Test 3: Test API endpoints
      await this.testApiEndpoints();
      
      // Test 4: Test socket connection
      await this.testSocketConnection();
      
      // Generate report
      this.generateConnectionReport();
      
    } catch (error) {
      console.error('❌ Connection tests failed:', error);
    }
  }

  /**
   * Test if mock mode is disabled
   */
  async testMockModeDisabled() {
    console.log('1️⃣ Testing Mock Mode Status...');
    
    try {
      // Initialize API service
      await apiService.init();
      
      // Check if mock mode is disabled
      const status = apiService.getStatus();
      this.testResults.mockModeDisabled = !status.mockMode;
      
      if (this.testResults.mockModeDisabled) {
        console.log('✅ Mock mode is DISABLED - using real backend');
      } else {
        console.log('❌ Mock mode is ENABLED - using mock data');
      }
      
    } catch (error) {
      console.error('❌ Error testing mock mode:', error.message);
    }
  }

  /**
   * Test backend connectivity
   */
  async testBackendConnectivity() {
    console.log('\n2️⃣ Testing Backend Connectivity...');
    
    try {
      // Test basic connectivity
      const response = await fetch(`${apiService.baseURL}/health`);
      
      if (response.ok) {
        this.testResults.backendReachable = true;
        console.log('✅ Backend is reachable');
        
        const healthData = await response.json();
        console.log('📊 Backend health:', healthData);
      } else {
        console.log(`❌ Backend responded with status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error.message);
      
      // Try alternative ports
      await this.tryAlternativePorts();
    }
  }

  /**
   * Try alternative ports if main port fails
   */
  async tryAlternativePorts() {
    console.log('🔄 Trying alternative ports...');
    
    const ports = [3000, 3028, 3001, 3010, 3015];
    const baseHost = '10.0.2.2'; // For Android emulator
    
    for (const port of ports) {
      try {
        const url = `http://${baseHost}:${port}/api/health`;
        console.log(`🔍 Trying port ${port}...`);
        
        const response = await fetch(url, { timeout: 5000 });
        
        if (response.ok) {
          console.log(`✅ Backend found on port ${port}!`);
          console.log(`📝 Update your API configuration to use port ${port}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Port ${port} failed: ${error.message}`);
      }
    }
  }

  /**
   * Test API endpoints
   */
  async testApiEndpoints() {
    console.log('\n3️⃣ Testing API Endpoints...');
    
    const endpoints = [
      { name: 'Health Check', path: '/health', method: 'GET' },
      { name: 'Driver Profile', path: '/driver/profile', method: 'GET' },
      { name: 'Ride Requests', path: '/rides/available', method: 'GET' },
      { name: 'Safety Metrics', path: '/safety/metrics', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      try {
        const url = `${apiService.baseURL}${endpoint.path}`;
        const response = await fetch(url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            ...(apiService.token && { 'Authorization': `Bearer ${apiService.token}` })
          }
        });

        this.testResults.apiEndpoints[endpoint.name] = {
          status: response.status,
          ok: response.ok,
          url: url
        };

        if (response.ok) {
          console.log(`✅ ${endpoint.name}: ${response.status}`);
        } else {
          console.log(`⚠️ ${endpoint.name}: ${response.status} (expected for unauthenticated requests)`);
        }
        
      } catch (error) {
        this.testResults.apiEndpoints[endpoint.name] = {
          error: error.message,
          url: `${apiService.baseURL}${endpoint.path}`
        };
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
    }
  }

  /**
   * Test socket connection
   */
  async testSocketConnection() {
    console.log('\n4️⃣ Testing Socket Connection...');
    
    try {
      // Initialize socket if not already done
      if (!apiService.socket) {
        apiService.initializeSocket();
      }

      // Wait a bit for socket to connect
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (apiService.socket && apiService.socket.connected) {
        this.testResults.socketConnection = true;
        console.log('✅ Socket connection established');
      } else {
        console.log('❌ Socket connection failed');
      }
      
    } catch (error) {
      console.error('❌ Socket connection test failed:', error.message);
    }
  }

  /**
   * Generate connection report
   */
  generateConnectionReport() {
    console.log('\n📋 Backend Connection Report');
    console.log('============================');
    
    console.log(`Mock Mode Disabled: ${this.testResults.mockModeDisabled ? '✅' : '❌'}`);
    console.log(`Backend Reachable: ${this.testResults.backendReachable ? '✅' : '❌'}`);
    console.log(`Socket Connected: ${this.testResults.socketConnection ? '✅' : '❌'}`);
    
    console.log('\nAPI Endpoints Status:');
    Object.entries(this.testResults.apiEndpoints).forEach(([name, result]) => {
      const status = result.ok ? '✅' : result.error ? '❌' : '⚠️';
      console.log(`  ${name}: ${status} ${result.status || result.error || 'No response'}`);
    });

    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (!this.testResults.mockModeDisabled) {
      console.log('• Mock mode is still enabled. Check your configuration files.');
    }
    
    if (!this.testResults.backendReachable) {
      console.log('• Backend is not reachable. Make sure your backend server is running.');
      console.log('• Check if the backend is running on the correct port.');
      console.log('• Verify network connectivity between app and backend.');
    }
    
    if (!this.testResults.socketConnection) {
      console.log('• Socket connection failed. Check WebSocket configuration.');
    }

    if (this.testResults.mockModeDisabled && this.testResults.backendReachable) {
      console.log('🎉 Backend connection is working correctly!');
      console.log('✅ You can now use real-time features with live data.');
    }
  }

  /**
   * Quick status check
   */
  getQuickStatus() {
    return {
      usingRealBackend: this.testResults.mockModeDisabled && this.testResults.backendReachable,
      mockMode: !this.testResults.mockModeDisabled,
      backendReachable: this.testResults.backendReachable,
      socketConnected: this.testResults.socketConnection,
    };
  }
}

// React Component for Connection Test UI
const BackendConnectionTestUI = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const tester = new BackendConnectionTester();
      await tester.runConnectionTests();
      setTestResults(tester.getQuickStatus());
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wifi" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>Backend Connection Test</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.testButton, isRunning && styles.testButtonDisabled]}
          onPress={handleRunTests}
          disabled={isRunning}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>
            {isRunning ? 'Testing...' : 'Test Backend Connection'}
          </Text>
        </TouchableOpacity>

        {testResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Connection Status</Text>
            
            <View style={styles.statusItem}>
              <Ionicons
                name={testResults.usingRealBackend ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={testResults.usingRealBackend ? '#00AA00' : '#FF4444'}
              />
              <Text style={styles.statusText}>Using Real Backend</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons
                name={!testResults.mockMode ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={!testResults.mockMode ? '#00AA00' : '#FF4444'}
              />
              <Text style={styles.statusText}>Mock Mode Disabled</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons
                name={testResults.backendReachable ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={testResults.backendReachable ? '#00AA00' : '#FF4444'}
              />
              <Text style={styles.statusText}>Backend Reachable</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons
                name={testResults.socketConnected ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={testResults.socketConnected ? '#00AA00' : '#FF4444'}
              />
              <Text style={styles.statusText}>Socket Connected</Text>
            </View>
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
    marginBottom: 20,
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

export { BackendConnectionTester, BackendConnectionTestUI };
export default BackendConnectionTester; 