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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export default function AndroidSpecificFeatures({ onFeatureActivated }) {
  const [permissions, setPermissions] = useState({
    location: false,
    camera: false,
    microphone: false,
    contacts: false,
    notifications: false,
    backgroundLocation: false,
  });
  
  const [batteryOptimization, setBatteryOptimization] = useState(false);
  const [autoStartPermission, setAutoStartPermission] = useState(false);
  const [overlayPermission, setOverlayPermission] = useState(false);

  useEffect(() => {
    checkPermissions();
    checkAndroidSpecificPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const cameraStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      const microphoneStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      const contactsStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
      const notificationStatus = await Notifications.getPermissionsAsync();

      setPermissions({
        location: locationStatus.status === 'granted',
        camera: cameraStatus,
        microphone: microphoneStatus,
        contacts: contactsStatus,
        notifications: notificationStatus.status === 'granted',
        backgroundLocation: false, // Will be checked separately
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const checkAndroidSpecificPermissions = async () => {
    if (Platform.OS === 'android') {
      // Check battery optimization
      try {
        const batteryOptimizationStatus = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
        );
        setBatteryOptimization(batteryOptimizationStatus);
      } catch (error) {
        console.log('Battery optimization check not available');
      }

      // Check overlay permission
      try {
        const overlayStatus = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW
        );
        setOverlayPermission(overlayStatus);
      } catch (error) {
        console.log('Overlay permission check not available');
      }
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissions(prev => ({ ...prev, location: true }));
        onFeatureActivated && onFeatureActivated('location');
      } else {
        Alert.alert('Permission Denied', 'Location permission is required for ride services.');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const requestBackgroundLocationPermission = async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status === 'granted') {
        setPermissions(prev => ({ ...prev, backgroundLocation: true }));
        onFeatureActivated && onFeatureActivated('backgroundLocation');
      } else {
        Alert.alert(
          'Background Location Required',
          'Background location is needed to track your position while driving.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting background location permission:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to camera for document verification.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setPermissions(prev => ({ ...prev, camera: true }));
        onFeatureActivated && onFeatureActivated('camera');
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to microphone for voice commands.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setPermissions(prev => ({ ...prev, microphone: true }));
        onFeatureActivated && onFeatureActivated('microphone');
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
    }
  };

  const requestContactsPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'This app needs access to contacts for emergency contact management.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setPermissions(prev => ({ ...prev, contacts: true }));
        onFeatureActivated && onFeatureActivated('contacts');
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setPermissions(prev => ({ ...prev, notifications: true }));
        onFeatureActivated && onFeatureActivated('notifications');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const requestBatteryOptimizationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          {
            title: 'Battery Optimization',
            message: 'Allow this app to run in background for ride notifications.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setBatteryOptimization(true);
          onFeatureActivated && onFeatureActivated('batteryOptimization');
        }
      } catch (error) {
        console.error('Error requesting battery optimization permission:', error);
      }
    }
  };

  const requestOverlayPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW,
          {
            title: 'Overlay Permission',
            message: 'Allow this app to show floating notifications.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setOverlayPermission(true);
          onFeatureActivated && onFeatureActivated('overlay');
        }
      } catch (error) {
        console.error('Error requesting overlay permission:', error);
      }
    }
  };

  const openAutoStartSettings = () => {
    Alert.alert(
      'Auto-Start Permission',
      'Some Android devices require manual permission for apps to auto-start. Please enable auto-start for this app in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  };

  const testHapticFeedback = () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(100);
    }
  };

  const renderPermissionItem = (title, description, granted, onRequest, icon) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionHeader}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={granted ? '#4CAF50' : '#FF9800'} 
        />
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: granted ? '#E8F5E8' : '#FFF3E0' }]}>
          <Text style={[styles.statusText, { color: granted ? '#4CAF50' : '#FF9800' }]}>
            {granted ? 'Granted' : 'Required'}
          </Text>
        </View>
      </View>
      {!granted && (
        <TouchableOpacity style={styles.requestButton} onPress={onRequest}>
          <Text style={styles.requestButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAndroidSpecificItem = (title, description, granted, onRequest, icon) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionHeader}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={granted ? '#4CAF50' : '#FF9800'} 
        />
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: granted ? '#E8F5E8' : '#FFF3E0' }]}>
          <Text style={[styles.statusText, { color: granted ? '#4CAF50' : '#FF9800' }]}>
            {granted ? 'Enabled' : 'Recommended'}
          </Text>
        </View>
      </View>
      {!granted && (
        <TouchableOpacity style={styles.requestButton} onPress={onRequest}>
          <Text style={styles.requestButtonText}>Enable</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Android Permissions & Features</Text>
      
      {/* Core Permissions */}
      <Text style={styles.subsectionTitle}>Core Permissions</Text>
      {renderPermissionItem(
        'Location Access',
        'Required for ride services and navigation',
        permissions.location,
        requestLocationPermission,
        'location'
      )}
      
      {renderPermissionItem(
        'Background Location',
        'Needed to track position while driving',
        permissions.backgroundLocation,
        requestBackgroundLocationPermission,
        'location-outline'
      )}
      
      {renderPermissionItem(
        'Camera Access',
        'For document verification and safety features',
        permissions.camera,
        requestCameraPermission,
        'camera'
      )}
      
      {renderPermissionItem(
        'Microphone Access',
        'For voice commands and emergency calls',
        permissions.microphone,
        requestMicrophonePermission,
        'mic'
      )}
      
      {renderPermissionItem(
        'Contacts Access',
        'For emergency contact management',
        permissions.contacts,
        requestContactsPermission,
        'people'
      )}
      
      {renderPermissionItem(
        'Notifications',
        'For ride requests and safety alerts',
        permissions.notifications,
        requestNotificationPermission,
        'notifications'
      )}

      {/* Android-Specific Features */}
      <Text style={styles.subsectionTitle}>Android Optimizations</Text>
      
      {renderAndroidSpecificItem(
        'Battery Optimization',
        'Allow app to run in background for notifications',
        batteryOptimization,
        requestBatteryOptimizationPermission,
        'battery-charging'
      )}
      
      {renderAndroidSpecificItem(
        'Overlay Permission',
        'Show floating notifications during rides',
        overlayPermission,
        requestOverlayPermission,
        'layers'
      )}
      
      <View style={styles.permissionItem}>
        <View style={styles.permissionHeader}>
          <Ionicons name="settings" size={24} color="#2196F3" />
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionTitle}>Auto-Start Settings</Text>
            <Text style={styles.permissionDescription}>
              Some devices require manual auto-start permission
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.requestButton} onPress={openAutoStartSettings}>
          <Text style={styles.requestButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Test Features */}
      <Text style={styles.subsectionTitle}>Test Features</Text>
      <TouchableOpacity style={styles.testButton} onPress={testHapticFeedback}>
        <Ionicons name="phone-portrait" size={20} color="#fff" />
        <Text style={styles.testButtonText}>Test Haptic Feedback</Text>
      </TouchableOpacity>

      {/* Device Info */}
      <Text style={styles.subsectionTitle}>Device Information</Text>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceInfoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.deviceInfoText}>Version: {Platform.Version}</Text>
        <Text style={styles.deviceInfoText}>Brand: {Device.brand}</Text>
        <Text style={styles.deviceInfoText}>Model: {Device.modelName}</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deviceInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deviceInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
}); 