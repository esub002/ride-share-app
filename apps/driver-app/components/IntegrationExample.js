import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

// Import the enhanced services
import enhancedSocket from '../utils/enhancedSocket';
import notificationService from '../utils/notificationService';
import requestQueueManager from '../utils/requestQueueManager';
import EnhancedRideRequests from './EnhancedRideRequests';

const IntegrationExample = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    initializeEnhancedSystem();
    return () => {
      cleanupEnhancedSystem();
    };
  }, []);

  // Initialize all enhanced services
  const initializeEnhancedSystem = async () => {
    try {
      console.log('🚀 Initializing enhanced ride request system...');

      // 1. Initialize notification service
      await notificationService.init();
      console.log('✅ Notification service initialized');

      // 2. Initialize request queue manager
      await requestQueueManager.init();
      console.log('✅ Request queue manager initialized');

      // 3. Setup socket connection
      await enhancedSocket.connect();
      console.log('✅ Enhanced socket connected');

      // 4. Setup connection status listener
      enhancedSocket.on('connected', () => {
        setConnectionStatus('connected');
        console.log('🔌 Socket connected');
      });

      enhancedSocket.on('disconnected', () => {
        setConnectionStatus('disconnected');
        console.log('🔌 Socket disconnected');
      });

      enhancedSocket.on('reconnecting', () => {
        setConnectionStatus('reconnecting');
        console.log('🔄 Socket reconnecting');
      });

      // 5. Setup ride request listeners
      enhancedSocket.on('newRideRequest', (rideRequest) => {
        console.log('🚗 New ride request received:', rideRequest);
        // The EnhancedRideRequests component will handle this automatically
      });

      enhancedSocket.on('rideCancelled', (data) => {
        console.log('❌ Ride cancelled:', data);
        notificationService.showWarningNotification(
          'Ride Cancelled',
          'A ride request has been cancelled by the passenger.'
        );
      });

      enhancedSocket.on('rideExpired', (data) => {
        console.log('⏰ Ride expired:', data);
        notificationService.showWarningNotification(
          'Ride Expired',
          'A ride request has expired.'
        );
      });

      setIsInitialized(true);
      console.log('🎉 Enhanced system fully initialized!');

    } catch (error) {
      console.error('❌ Failed to initialize enhanced system:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the enhanced ride request system. Please restart the app.',
        [{ text: 'OK' }]
      );
    }
  };

  // Cleanup enhanced system
  const cleanupEnhancedSystem = () => {
    try {
      enhancedSocket.disconnect();
      notificationService.cleanup();
      console.log('🧹 Enhanced system cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  };

  // Handle ride acceptance
  const handleRideAccepted = (rideRequest) => {
    console.log('✅ Ride accepted:', rideRequest);
    
    // Show success notification
    notificationService.showSuccessNotification(
      'Ride Accepted!',
      `You're on your way to ${rideRequest.pickup}`
    );

    // You can add additional logic here, such as:
    // - Navigate to ride details screen
    // - Start navigation
    // - Update driver status
    // - Send analytics data
  };

  // Handle ride rejection
  const handleRideRejected = (rideRequest) => {
    console.log('❌ Ride rejected:', rideRequest);
    
    // You can add additional logic here, such as:
    // - Update driver availability
    // - Send analytics data
    // - Show rejection reason modal
  };

  // Test functions for development
  const testNewRideRequest = () => {
    const testRequest = {
      id: Date.now(),
      pickup: '123 Main St, Downtown',
      destination: '456 Oak Ave, Uptown',
      fare: 25.50,
      distance: 2.5,
      estimated_duration: 15,
      passenger_name: 'John Doe',
      created_at: new Date().toISOString(),
    };

    // Simulate receiving a new ride request
    enhancedSocket.emit('newRideRequest', testRequest);
  };

  const testConnection = () => {
    const status = enhancedSocket.getStatus();
    Alert.alert(
      'Connection Status',
      `Connected: ${status.connected}\nState: ${status.state}\nReconnect Attempts: ${status.reconnectAttempts}`,
      [{ text: 'OK' }]
    );
  };

  const testNotification = () => {
    notificationService.showRideRequestNotification({
      id: 999,
      pickup: 'Test Pickup',
      destination: 'Test Destination',
      fare: 10.00,
    });
  };

  const showQueueStats = () => {
    const stats = requestQueueManager.getQueueStats();
    Alert.alert(
      'Queue Statistics',
      `Active Requests: ${stats.activeRequests}\nTotal History: ${stats.totalHistory}\nRecent Requests: ${stats.recentRequests}\nAvg Response Time: ${Math.round(stats.averageResponseTime / 1000)}s`,
      [{ text: 'OK' }]
    );
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing Enhanced System...</Text>
        <Text style={styles.statusText}>Status: {connectionStatus}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Ride Requests</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(connectionStatus) }]} />
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>
      </View>

      {/* Main Enhanced Ride Requests Component */}
      <EnhancedRideRequests
        onRideAccepted={handleRideAccepted}
        onRideRejected={handleRideRejected}
      />

      {/* Test Controls (remove in production) */}
      <View style={styles.testControls}>
        <Text style={styles.testTitle}>Test Controls (Development Only)</Text>
        <View style={styles.testButtons}>
          <Text style={styles.testButton} onPress={testNewRideRequest}>
            Test New Request
          </Text>
          <Text style={styles.testButton} onPress={testConnection}>
            Test Connection
          </Text>
          <Text style={styles.testButton} onPress={testNotification}>
            Test Notification
          </Text>
          <Text style={styles.testButton} onPress={showQueueStats}>
            Show Stats
          </Text>
        </View>
      </View>
    </View>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'connected': return '#4CAF50';
    case 'connecting': return '#FF9800';
    case 'reconnecting': return '#FF9800';
    case 'error': return '#f44336';
    default: return '#ccc';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  testControls: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  testButton: {
    backgroundColor: '#2196F3',
    color: '#fff',
    padding: 8,
    margin: 4,
    borderRadius: 4,
    fontSize: 12,
  },
});

export default IntegrationExample; 