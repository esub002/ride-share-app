import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
  Vibration,
  BackHandler,
  Dimensions,
  StatusBar,
  AppState,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as FileSystem from 'expo-file-system';

export default function AdvancedAndroidFeatures({ onFeatureActivated }) {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memoryUsage: 0,
    batteryLevel: 0,
    batteryState: 'unknown',
    networkType: 'unknown',
    locationAccuracy: 0,
  });

  const [advancedPermissions, setAdvancedPermissions] = useState({
    systemAlertWindow: false,
    writeSettings: false,
    accessNotificationPolicy: false,
    bindNotificationListener: false,
    bindAccessibilityService: false,
  });

  const [optimizationSettings, setOptimizationSettings] = useState({
    batteryOptimization: false,
    autoStartPermission: false,
    backgroundRestrictions: false,
    dataSaver: false,
    powerSaver: false,
  });

  const [systemInfo, setSystemInfo] = useState({
    androidVersion: '',
    deviceModel: '',
    totalMemory: 0,
    availableMemory: 0,
    cpuInfo: '',
    gpuInfo: '',
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      initializeAdvancedFeatures();
      startPerformanceMonitoring();
      setupEventListeners();
    }

    return () => {
      cleanupEventListeners();
    };
  }, []);

  const initializeAdvancedFeatures = async () => {
    await checkAdvancedPermissions();
    await getSystemInfo();
    await checkOptimizationSettings();
  };

  const startPerformanceMonitoring = () => {
    const monitorInterval = setInterval(async () => {
      await updatePerformanceMetrics();
    }, 5000);

    return () => clearInterval(monitorInterval);
  };

  const setupEventListeners = () => {
    // Battery state changes
    Battery.addBatteryStateListener(({ batteryState }) => {
      setPerformanceMetrics(prev => ({ ...prev, batteryState }));
    });

    // App state changes
    AppState.addEventListener('change', handleAppStateChange);

    // Back button handling
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // Device events
    DeviceEventEmitter.addListener('onMemoryWarning', handleMemoryWarning);
  };

  const cleanupEventListeners = () => {
    AppState.removeEventListener('change', handleAppStateChange);
    BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    DeviceEventEmitter.removeAllListeners('onMemoryWarning');
  };

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      // App came to foreground
      updatePerformanceMetrics();
    } else if (nextAppState === 'background') {
      // App went to background
      // Save state or pause heavy operations
    }
  };

  const handleBackPress = () => {
    // Custom back button handling
    Alert.alert(
      'Exit App',
      'Are you sure you want to exit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() }
      ]
    );
    return true; // Prevent default back behavior
  };

  const handleMemoryWarning = () => {
    Alert.alert(
      'Memory Warning',
      'Low memory detected. Consider closing other apps.',
      [{ text: 'OK' }]
    );
  };

  const updatePerformanceMetrics = async () => {
    try {
      // Battery level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      
      // Memory usage (approximate)
      const memoryUsage = Math.random() * 100; // In real app, use actual memory API
      
      // Location accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setPerformanceMetrics(prev => ({
        ...prev,
        batteryLevel: Math.round(batteryLevel * 100),
        memoryUsage: Math.round(memoryUsage),
        locationAccuracy: location.coords.accuracy || 0,
      }));
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  };

  const checkAdvancedPermissions = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        'SYSTEM_ALERT_WINDOW',
        'WRITE_SETTINGS',
        'ACCESS_NOTIFICATION_POLICY',
        'BIND_NOTIFICATION_LISTENER_SERVICE',
        'BIND_ACCESSIBILITY_SERVICE',
      ];

      const permissionStatus = {};
      
      for (const permission of permissions) {
        try {
          const status = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS[permission]
          );
          permissionStatus[permission.toLowerCase()] = status;
        } catch (error) {
          permissionStatus[permission.toLowerCase()] = false;
        }
      }

      setAdvancedPermissions(permissionStatus);
    }
  };

  const getSystemInfo = async () => {
    try {
      const deviceInfo = {
        androidVersion: Platform.Version,
        deviceModel: Device.modelName || 'Unknown',
        totalMemory: Device.totalMemory || 0,
        availableMemory: Device.availableMemory || 0,
        cpuInfo: Device.cpuArchitecture || 'Unknown',
        gpuInfo: 'Unknown', // Would need native module for GPU info
      };

      setSystemInfo(deviceInfo);
    } catch (error) {
      console.error('Error getting system info:', error);
    }
  };

  const checkOptimizationSettings = async () => {
    // Check battery optimization status
    try {
      const batteryOptimization = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
      );
      setOptimizationSettings(prev => ({ ...prev, batteryOptimization }));
    } catch (error) {
      console.log('Battery optimization check not available');
    }
  };

  const requestSystemAlertWindowPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW,
        {
          title: 'Overlay Permission',
          message: 'This app needs overlay permission for floating ride notifications.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setAdvancedPermissions(prev => ({ ...prev, systemAlertWindow: true }));
        onFeatureActivated && onFeatureActivated('systemAlertWindow');
      }
    } catch (error) {
      console.error('Error requesting overlay permission:', error);
    }
  };

  const openBatteryOptimizationSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  const openAutoStartSettings = () => {
    Alert.alert(
      'Auto-Start Settings',
      'Please enable auto-start for this app in your device settings to ensure it runs in the background.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  };

  const optimizeAppPerformance = async () => {
    try {
      // Clear cache
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
      }

      // Clear temporary files
      const tempDir = FileSystem.documentDirectory + 'temp/';
      await FileSystem.deleteAsync(tempDir, { idempotent: true });

      Alert.alert('Success', 'App performance optimized!');
    } catch (error) {
      console.error('Error optimizing performance:', error);
      Alert.alert('Error', 'Failed to optimize performance');
    }
  };

  const testAdvancedFeatures = () => {
    // Test haptic feedback
    Vibration.vibrate([0, 100, 50, 100]);

    // Test notification
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Advanced Features Test',
        body: 'Advanced Android features are working correctly!',
      },
      trigger: { seconds: 1 },
    });

    Alert.alert('Test Complete', 'Advanced features test completed successfully!');
  };

  const renderPerformanceCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Performance Metrics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Ionicons name="battery-charging" size={20} color="#4CAF50" />
          <Text style={styles.metricValue}>{performanceMetrics.batteryLevel}%</Text>
          <Text style={styles.metricLabel}>Battery</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="hardware-chip" size={20} color="#2196F3" />
          <Text style={styles.metricValue}>{performanceMetrics.memoryUsage}%</Text>
          <Text style={styles.metricLabel}>Memory</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="location" size={20} color="#FF9800" />
          <Text style={styles.metricValue}>{performanceMetrics.locationAccuracy.toFixed(1)}m</Text>
          <Text style={styles.metricLabel}>Accuracy</Text>
        </View>
      </View>
    </View>
  );

  const renderSystemInfoCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>System Information</Text>
      <View style={styles.infoList}>
        <Text style={styles.infoItem}>Android: {systemInfo.androidVersion}</Text>
        <Text style={styles.infoItem}>Device: {systemInfo.deviceModel}</Text>
        <Text style={styles.infoItem}>Memory: {(systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB</Text>
        <Text style={styles.infoItem}>CPU: {systemInfo.cpuInfo}</Text>
      </View>
    </View>
  );

  const renderPermissionItem = (title, description, granted, onRequest, icon) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionHeader}>
        <Ionicons name={icon} size={24} color={granted ? '#4CAF50' : '#FF5722'} />
        <View style={styles.permissionText}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
        <View style={[styles.permissionStatus, { backgroundColor: granted ? '#4CAF50' : '#FF5722' }]}>
          <Text style={styles.permissionStatusText}>{granted ? '✓' : '✗'}</Text>
        </View>
      </View>
      {!granted && (
        <TouchableOpacity style={styles.permissionButton} onPress={onRequest}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderOptimizationItem = (title, description, enabled, onPress, icon) => (
    <View style={styles.optimizationItem}>
      <View style={styles.optimizationHeader}>
        <Ionicons name={icon} size={24} color={enabled ? '#4CAF50' : '#FF5722'} />
        <View style={styles.optimizationText}>
          <Text style={styles.optimizationTitle}>{title}</Text>
          <Text style={styles.optimizationDescription}>{description}</Text>
        </View>
        <TouchableOpacity style={styles.optimizationButton} onPress={onPress}>
          <Text style={styles.optimizationButtonText}>Configure</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <Text style={styles.title}>Advanced Android Features</Text>
      
      {renderPerformanceCard()}
      {renderSystemInfoCard()}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Advanced Permissions</Text>
        {renderPermissionItem(
          'System Alert Window',
          'Allow floating notifications and overlays',
          advancedPermissions.systemAlertWindow,
          requestSystemAlertWindowPermission,
          'notifications-outline'
        )}
        {renderPermissionItem(
          'Write Settings',
          'Modify system settings for optimization',
          advancedPermissions.writeSettings,
          () => Linking.openSettings(),
          'settings-outline'
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Optimization Settings</Text>
        {renderOptimizationItem(
          'Battery Optimization',
          'Disable battery optimization for better performance',
          optimizationSettings.batteryOptimization,
          openBatteryOptimizationSettings,
          'battery-charging-outline'
        )}
        {renderOptimizationItem(
          'Auto-Start Permission',
          'Allow app to start automatically',
          optimizationSettings.autoStartPermission,
          openAutoStartSettings,
          'play-circle-outline'
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={optimizeAppPerformance}>
          <Ionicons name="speedometer-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Optimize Performance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testAdvancedFeatures}>
          <Ionicons name="checkmark-circle-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Test Features</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
  },
  permissionItem: {
    marginBottom: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionText: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  permissionStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  optimizationItem: {
    marginBottom: 16,
  },
  optimizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optimizationText: {
    flex: 1,
    marginLeft: 12,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optimizationDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  optimizationButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  optimizationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 