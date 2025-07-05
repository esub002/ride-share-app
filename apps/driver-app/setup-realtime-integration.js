#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📱 Driver App Real-Time Integration Setup\n');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Files to update
const filesToUpdate = [
  {
    path: 'App.js',
    description: 'Main app file with real-time manager integration',
    template: `// Add to imports
import EnhancedRealTimeManager from './utils/enhancedRealTimeManager';

// Add to component state
const [realTimeManager, setRealTimeManager] = useState(null);

// Add to useEffect
useEffect(() => {
  const initRealTime = async () => {
    const manager = new EnhancedRealTimeManager();
    await manager.connect('${BACKEND_URL}');
    
    // Listen for real-time events
    manager.on('ride:request', (data) => {
      console.log('New ride request:', data);
      // Handle new ride request
    });
    
    manager.on('performance:updated', (metrics) => {
      console.log('Performance metrics:', metrics);
      // Update performance display
    });
    
    manager.on('location:updated', (location) => {
      console.log('Location updated:', location);
      // Update location display
    });
    
    setRealTimeManager(manager);
  };
  
  initRealTime();
  
  return () => {
    if (realTimeManager) {
      realTimeManager.destroy();
    }
  };
}, []);`
  },
  {
    path: 'utils/api.js',
    description: 'API service with real-time integration',
    template: `// Add to imports
import EnhancedRealTimeManager from './enhancedRealTimeManager';

// Add to ApiService class
class ApiService {
  constructor() {
    // ... existing code ...
    this.realTimeManager = null;
  }
  
  async initRealTime() {
    this.realTimeManager = new EnhancedRealTimeManager();
    await this.realTimeManager.connect('${BACKEND_URL}');
    return this.realTimeManager;
  }
  
  getRealTimeManager() {
    return this.realTimeManager;
  }
}`
  },
  {
    path: 'components/RealTimeDashboard.js',
    description: 'New component for real-time dashboard',
    template: `import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './ui/Card';

export default function RealTimeDashboard({ realTimeManager }) {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  useEffect(() => {
    if (!realTimeManager) return;
    
    const handleMetrics = (data) => {
      setMetrics(data);
    };
    
    const handleAlerts = (data) => {
      setAlerts(data);
    };
    
    const handleConnection = (status) => {
      setConnectionStatus(status);
    };
    
    realTimeManager.on('performance:updated', handleMetrics);
    realTimeManager.on('performance:alerts', handleAlerts);
    realTimeManager.on('connected', () => handleConnection('connected'));
    realTimeManager.on('disconnected', () => handleConnection('disconnected'));
    
    return () => {
      realTimeManager.off('performance:updated', handleMetrics);
      realTimeManager.off('performance:alerts', handleAlerts);
    };
  }, [realTimeManager]);
  
  return (
    <ScrollView style={styles.container}>
      <Card variant="elevated" size="large" style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons 
            name={connectionStatus === 'connected' ? 'wifi' : 'wifi-outline'} 
            size={24} 
            color={connectionStatus === 'connected' ? '#4CAF50' : '#F44336'} 
          />
          <Text style={styles.statusText}>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </Card>
      
      {Object.keys(metrics).length > 0 && (
        <Card variant="elevated" size="large" style={styles.metricsCard}>
          <Text style={styles.cardTitle}>Real-Time Metrics</Text>
          {Object.entries(metrics).map(([key, value]) => (
            <View key={key} style={styles.metricItem}>
              <Text style={styles.metricLabel}>{key}</Text>
              <Text style={styles.metricValue}>{value}</Text>
            </View>
          ))}
        </Card>
      )}
      
      {alerts.length > 0 && (
        <Card variant="elevated" size="large" style={styles.alertsCard}>
          <Text style={styles.cardTitle}>System Alerts</Text>
          {alerts.map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <Ionicons name="warning" size={16} color="#FF9800" />
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertsCard: {
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF9800',
  },
});`
  }
];

function createFile(filePath, content) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Created ${filePath}`);
}

function updateFile(filePath, template) {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`⚠️  File ${filePath} already exists. Please manually add the integration code.`);
    console.log(`   Template:\n${template}\n`);
  } else {
    createFile(filePath, template);
  }
}

function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['socket.io-client', 'expo-location', 'expo-notifications'];
  
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log('⚠️  Missing dependencies:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    console.log('\nRun: npm install ' + missingDeps.join(' '));
    return false;
  }
  
  console.log('✅ All required dependencies are installed');
  return true;
}

function setupRealTimeIntegration() {
  console.log('🔧 Setting up real-time integration...\n');
  
  // Check dependencies
  if (!checkDependencies()) {
    console.log('\n❌ Please install missing dependencies first');
    return;
  }
  
  // Create/update files
  filesToUpdate.forEach(file => {
    console.log(`📝 ${file.description}`);
    updateFile(file.path, file.template);
  });
  
  // Create additional utility files
  createFile('utils/realTimeConfig.js', `// Real-time configuration
export const REAL_TIME_CONFIG = {
  BACKEND_URL: '${BACKEND_URL}',
  RECONNECTION_ATTEMPTS: 10,
  RECONNECTION_DELAY: 1000,
  HEARTBEAT_INTERVAL: 30000,
  LOCATION_UPDATE_INTERVAL: 5000,
  LOCATION_ACCURACY: 'high',
  NOTIFICATION_SOUND: true,
  NOTIFICATION_VIBRATION: true
};

export const SOCKET_EVENTS = {
  RIDE_REQUEST: 'ride:request',
  RIDE_STATUS_UPDATE: 'ride:statusUpdate',
  LOCATION_UPDATE: 'location:update',
  PERFORMANCE_METRICS: 'performance:updated',
  SYSTEM_ALERTS: 'performance:alerts',
  MESSAGE_RECEIVED: 'message:received',
  CALL_INCOMING: 'call:incoming',
  GEOFENCE_ENTERED: 'geofence:entered',
  GEOFENCE_EXITED: 'geofence:exited'
};`);
  
  console.log('\n🎉 Real-time integration setup completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the generated files and templates');
  console.log('2. Manually integrate the code into your existing components');
  console.log('3. Test the real-time features with the backend');
  console.log('4. Add the RealTimeDashboard component to your navigation');
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupRealTimeIntegration();
}

module.exports = { setupRealTimeIntegration, checkDependencies }; 