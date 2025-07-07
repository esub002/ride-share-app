import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Modal,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// Import our enhanced services
import enhancedRealTimeManager from '../utils/enhancedRealTimeManager';
import apiService from '../utils/api';

const { width, height } = Dimensions.get('window');

const RealTimeSafetyMonitoring = () => {
  // State management
  const [safetyStatus, setSafetyStatus] = useState('safe'); // safe, warning, danger, emergency
  const [safetyAlerts, setSafetyAlerts] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [safetyMetrics, setSafetyMetrics] = useState({
    speed: 0,
    acceleration: 0,
    braking: 0,
    fatigue: 0,
    weather: 'clear',
    roadCondition: 'good',
  });
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyLocation, setEmergencyLocation] = useState(null);
  const [safetyScore, setSafetyScore] = useState(100);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [safetyHistory, setSafetyHistory] = useState([]);
  const [activeGeofences, setActiveGeofences] = useState([]);
  const [safetySettings, setSafetySettings] = useState({
    speedLimit: 80,
    fatigueThreshold: 70,
    weatherAlerts: true,
    emergencyAutoDial: true,
  });

  // Animation refs
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const emergencyAnimation = useRef(new Animated.Value(0)).current;
  const alertAnimation = useRef(new Animated.Value(0)).current;
  const safetyScoreAnimation = useRef(new Animated.Value(100)).current;

  // Refs for cleanup
  const safetyCheckInterval = useRef(null);
  const emergencyTimer = useRef(null);
  const alertTimeout = useRef(null);

  // Initialize safety monitoring
  useEffect(() => {
    initializeSafetyMonitoring();
    setupEventListeners();
    setupNotifications();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize safety monitoring
  const initializeSafetyMonitoring = async () => {
    try {
      // Connect to real-time manager
      await enhancedRealTimeManager.connect();
      
      // Load emergency contacts
      await loadEmergencyContacts();
      
      // Load safety history
      await loadSafetyHistory();
      
      // Start safety monitoring
      startSafetyMonitoring();
      
      console.log('🛡️ Real-time safety monitoring initialized');
    } catch (error) {
      console.error('🛡️ Failed to initialize safety monitoring:', error);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // Safety alerts
    enhancedRealTimeManager.on('safety:alert', (alertData) => {
      handleSafetyAlert(alertData);
    });

    // Emergency triggered
    enhancedRealTimeManager.on('emergency:triggered', (emergencyData) => {
      handleEmergencyTriggered(emergencyData);
    });

    // Safety metrics updates
    enhancedRealTimeManager.on('safety:metrics', (metrics) => {
      handleSafetyMetricsUpdate(metrics);
    });

    // Geofence safety events
    enhancedRealTimeManager.on('geofence:safety', (geofenceData) => {
      handleGeofenceSafetyEvent(geofenceData);
    });

    // Weather alerts
    enhancedRealTimeManager.on('weather:alert', (weatherData) => {
      handleWeatherAlert(weatherData);
    });

    // Road condition updates
    enhancedRealTimeManager.on('road:condition', (roadData) => {
      handleRoadConditionUpdate(roadData);
    });
  };

  // Setup notifications
  const setupNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted for safety alerts');
      }
    } catch (error) {
      console.error('🛡️ Error setting up notifications:', error);
    }
  };

  // Start safety monitoring
  const startSafetyMonitoring = () => {
    safetyCheckInterval.current = setInterval(async () => {
      await checkSafetyMetrics();
    }, 5000); // Check every 5 seconds
  };

  // Check safety metrics
  const checkSafetyMetrics = async () => {
    try {
      const metrics = await apiService.getSafetyMetrics();
      setSafetyMetrics(metrics);
      
      // Calculate safety score
      const score = calculateSafetyScore(metrics);
      setSafetyScore(score);
      
      // Animate safety score
      Animated.timing(safetyScoreAnimation, {
        toValue: score,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      
      // Check for safety violations
      checkSafetyViolations(metrics);
      
    } catch (error) {
      console.error('🛡️ Error checking safety metrics:', error);
    }
  };

  // Calculate safety score
  const calculateSafetyScore = (metrics) => {
    let score = 100;
    
    // Speed penalty
    if (metrics.speed > safetySettings.speedLimit) {
      score -= Math.min(30, (metrics.speed - safetySettings.speedLimit) * 2);
    }
    
    // Acceleration penalty
    if (Math.abs(metrics.acceleration) > 5) {
      score -= Math.min(20, Math.abs(metrics.acceleration) * 2);
    }
    
    // Braking penalty
    if (metrics.braking > 8) {
      score -= Math.min(15, metrics.braking * 1.5);
    }
    
    // Fatigue penalty
    if (metrics.fatigue > safetySettings.fatigueThreshold) {
      score -= Math.min(25, (metrics.fatigue - safetySettings.fatigueThreshold) * 0.5);
    }
    
    // Weather penalty
    if (metrics.weather !== 'clear') {
      score -= 10;
    }
    
    // Road condition penalty
    if (metrics.roadCondition !== 'good') {
      score -= 15;
    }
    
    return Math.max(0, score);
  };

  // Check safety violations
  const checkSafetyViolations = (metrics) => {
    const violations = [];
    
    if (metrics.speed > safetySettings.speedLimit) {
      violations.push({
        type: 'speed',
        severity: 'warning',
        message: `Speed limit exceeded: ${metrics.speed} km/h`,
      });
    }
    
    if (Math.abs(metrics.acceleration) > 8) {
      violations.push({
        type: 'acceleration',
        severity: 'warning',
        message: 'Aggressive acceleration detected',
      });
    }
    
    if (metrics.braking > 10) {
      violations.push({
        type: 'braking',
        severity: 'warning',
        message: 'Hard braking detected',
      });
    }
    
    if (metrics.fatigue > safetySettings.fatigueThreshold) {
      violations.push({
        type: 'fatigue',
        severity: 'danger',
        message: 'Driver fatigue detected',
      });
    }
    
    if (violations.length > 0) {
      handleSafetyViolations(violations);
    }
  };

  // Handle safety violations
  const handleSafetyViolations = (violations) => {
    violations.forEach(violation => {
      handleSafetyAlert({
        id: `violation_${Date.now()}`,
        type: violation.type,
        severity: violation.severity,
        message: violation.message,
        timestamp: new Date().toISOString(),
      });
    });
  };

  // Handle safety alert
  const handleSafetyAlert = (alertData) => {
    setSafetyAlerts(prev => [alertData, ...prev].slice(0, 20));
    
    // Trigger haptic feedback
    if (alertData.severity === 'danger') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate([0, 500, 200, 500]);
    } else if (alertData.severity === 'warning') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    // Show notification
    showSafetyNotification(alertData);
    
    // Trigger alert animation
    triggerAlertAnimation();
    
    // Update safety status
    updateSafetyStatus(alertData.severity);
    
    console.log('🛡️ Safety alert:', alertData);
  };

  // Handle emergency triggered
  const handleEmergencyTriggered = (emergencyData) => {
    setIsEmergencyMode(true);
    setEmergencyLocation(emergencyData.location);
    
    // Start emergency animation
    startEmergencyAnimation();
    
    // Show emergency modal
    setShowEmergencyModal(true);
    
    // Trigger emergency haptics
    Vibration.vibrate([0, 1000, 500, 1000], true);
    
    // Auto-dial emergency contacts if enabled
    if (safetySettings.emergencyAutoDial) {
      autoDialEmergencyContacts();
    }
    
    console.log('🛡️ Emergency triggered:', emergencyData);
  };

  // Handle safety metrics update
  const handleSafetyMetricsUpdate = (metrics) => {
    setSafetyMetrics(metrics);
  };

  // Handle geofence safety event
  const handleGeofenceSafetyEvent = (geofenceData) => {
    setActiveGeofences(prev => {
      const updated = prev.filter(g => g.id !== geofenceData.id);
      return [...updated, geofenceData];
    });
  };

  // Handle weather alert
  const handleWeatherAlert = (weatherData) => {
    if (safetySettings.weatherAlerts) {
      handleSafetyAlert({
        id: `weather_${Date.now()}`,
        type: 'weather',
        severity: 'warning',
        message: `Weather alert: ${weatherData.condition}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Handle road condition update
  const handleRoadConditionUpdate = (roadData) => {
    setSafetyMetrics(prev => ({
      ...prev,
      roadCondition: roadData.condition,
    }));
  };

  // Load emergency contacts
  const loadEmergencyContacts = async () => {
    try {
      const contacts = await apiService.getEmergencyContacts();
      setEmergencyContacts(contacts);
    } catch (error) {
      console.error('🛡️ Error loading emergency contacts:', error);
    }
  };

  // Load safety history
  const loadSafetyHistory = async () => {
    try {
      const history = await apiService.getSafetyHistory();
      setSafetyHistory(history);
    } catch (error) {
      console.error('🛡️ Error loading safety history:', error);
    }
  };

  // Trigger emergency
  const triggerEmergency = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const emergencyData = {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        },
        timestamp: new Date().toISOString(),
        type: 'manual',
      };
      
      await enhancedRealTimeManager.triggerEmergency(emergencyData);
      handleEmergencyTriggered(emergencyData);
      
    } catch (error) {
      console.error('🛡️ Error triggering emergency:', error);
      Alert.alert('Error', 'Failed to trigger emergency. Please try again.');
    }
  };

  // Cancel emergency
  const cancelEmergency = async () => {
    try {
      await enhancedRealTimeManager.cancelEmergency();
      setIsEmergencyMode(false);
      setShowEmergencyModal(false);
      
      // Stop emergency animation
      stopEmergencyAnimation();
      
      // Stop vibration
      Vibration.cancel();
      
      console.log('🛡️ Emergency cancelled');
    } catch (error) {
      console.error('🛡️ Error cancelling emergency:', error);
    }
  };

  // Auto-dial emergency contacts
  const autoDialEmergencyContacts = () => {
    if (emergencyContacts.length > 0) {
      const primaryContact = emergencyContacts[0];
      // In a real app, this would integrate with phone dialing
      console.log('🛡️ Auto-dialing emergency contact:', primaryContact.phone);
    }
  };

  // Show safety notification
  const showSafetyNotification = (alertData) => {
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Safety Alert',
        body: alertData.message,
        data: alertData,
      },
      trigger: null,
    });
  };

  // Update safety status
  const updateSafetyStatus = (severity) => {
    let newStatus = 'safe';
    
    if (severity === 'emergency') {
      newStatus = 'emergency';
    } else if (severity === 'danger') {
      newStatus = 'danger';
    } else if (severity === 'warning') {
      newStatus = 'warning';
    }
    
    setSafetyStatus(newStatus);
  };

  // Start emergency animation
  const startEmergencyAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(emergencyAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(emergencyAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Stop emergency animation
  const stopEmergencyAnimation = () => {
    emergencyAnimation.setValue(0);
  };

  // Trigger alert animation
  const triggerAlertAnimation = () => {
    Animated.sequence([
      Animated.timing(alertAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(alertAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Get safety status color
  const getSafetyStatusColor = () => {
    switch (safetyStatus) {
      case 'emergency':
        return '#FF0000';
      case 'danger':
        return '#FF4444';
      case 'warning':
        return '#FFAA00';
      default:
        return '#00AA00';
    }
  };

  // Get safety status text
  const getSafetyStatusText = () => {
    switch (safetyStatus) {
      case 'emergency':
        return 'EMERGENCY';
      case 'danger':
        return 'DANGER';
      case 'warning':
        return 'WARNING';
      default:
        return 'SAFE';
    }
  };

  // Cleanup
  const cleanup = () => {
    if (safetyCheckInterval.current) clearInterval(safetyCheckInterval.current);
    if (emergencyTimer.current) clearTimeout(emergencyTimer.current);
    if (alertTimeout.current) clearTimeout(alertTimeout.current);
    
    Vibration.cancel();
    
    enhancedRealTimeManager.off('safety:alert');
    enhancedRealTimeManager.off('emergency:triggered');
    enhancedRealTimeManager.off('safety:metrics');
    enhancedRealTimeManager.off('geofence:safety');
    enhancedRealTimeManager.off('weather:alert');
    enhancedRealTimeManager.off('road:condition');
  };

  // Render safety status
  const renderSafetyStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Safety Status</Text>
      <View style={[styles.safetyStatusCard, { borderColor: getSafetyStatusColor() }]}>
        <Animated.View
          style={[
            styles.safetyStatusIndicator,
            {
              backgroundColor: getSafetyStatusColor(),
              transform: [{ scale: emergencyAnimation }],
            }
          ]}
        />
        <Text style={[styles.safetyStatusText, { color: getSafetyStatusColor() }]}>
          {getSafetyStatusText()}
        </Text>
        <Text style={styles.safetyScore}>
          Safety Score: {Math.round(safetyScore)}
        </Text>
      </View>
    </View>
  );

  // Render safety metrics
  const renderSafetyMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Safety Metrics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="speedometer" size={20} color="#007AFF" />
          <Text style={styles.metricLabel}>Speed</Text>
          <Text style={styles.metricValue}>{safetyMetrics.speed} km/h</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Ionicons name="trending-up" size={20} color="#007AFF" />
          <Text style={styles.metricLabel}>Acceleration</Text>
          <Text style={styles.metricValue}>{safetyMetrics.acceleration.toFixed(1)} m/s²</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Ionicons name="trending-down" size={20} color="#007AFF" />
          <Text style={styles.metricLabel}>Braking</Text>
          <Text style={styles.metricValue}>{safetyMetrics.braking.toFixed(1)} m/s²</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Ionicons name="eye" size={20} color="#007AFF" />
          <Text style={styles.metricLabel}>Fatigue</Text>
          <Text style={styles.metricValue}>{safetyMetrics.fatigue}%</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Ionicons name="partly-sunny" size={20} color="#007AFF" />
          <Text style={styles.metricLabel}>Weather</Text>
          <Text style={styles.metricValue}>{safetyMetrics.weather}</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Ionicons name="road" size={20} color="#007AFF" />
          <Text style={styles.metricLabel}>Road Condition</Text>
          <Text style={styles.metricValue}>{safetyMetrics.roadCondition}</Text>
        </View>
      </View>
    </View>
  );

  // Render safety alerts
  const renderSafetyAlerts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      <ScrollView style={styles.alertsContainer} showsVerticalScrollIndicator={false}>
        {safetyAlerts.map((alert, index) => (
          <Animated.View
            key={alert.id}
            style={[
              styles.alertItem,
              {
                borderLeftColor: alert.severity === 'danger' ? '#FF4444' : '#FFAA00',
                transform: [{ scale: alertAnimation }]
              }
            ]}
          >
            <View style={styles.alertHeader}>
              <Ionicons
                name={alert.severity === 'danger' ? 'warning' : 'information-circle'}
                size={16}
                color={alert.severity === 'danger' ? '#FF4444' : '#FFAA00'}
              />
              <Text style={styles.alertType}>{alert.type.toUpperCase()}</Text>
              <Text style={styles.alertTime}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.alertMessage}>{alert.message}</Text>
          </Animated.View>
        ))}
        {safetyAlerts.length === 0 && (
          <Text style={styles.noAlerts}>No recent alerts</Text>
        )}
      </ScrollView>
    </View>
  );

  // Render emergency button
  const renderEmergencyButton = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={[
          styles.emergencyButton,
          isEmergencyMode && styles.emergencyButtonActive
        ]}
        onPress={isEmergencyMode ? cancelEmergency : triggerEmergency}
      >
        <Ionicons
          name={isEmergencyMode ? 'close-circle' : 'warning'}
          size={32}
          color="#FFFFFF"
        />
        <Text style={styles.emergencyButtonText}>
          {isEmergencyMode ? 'Cancel Emergency' : 'Emergency SOS'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render emergency modal
  const renderEmergencyModal = () => (
    <Modal
      visible={showEmergencyModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Animated.View
            style={[
              styles.emergencyModalHeader,
              { transform: [{ scale: emergencyAnimation }] }
            ]}
          >
            <Ionicons name="warning" size={60} color="#FF0000" />
            <Text style={styles.emergencyModalTitle}>EMERGENCY TRIGGERED</Text>
          </Animated.View>
          
          <Text style={styles.emergencyModalMessage}>
            Emergency services have been notified. Stay calm and follow instructions.
          </Text>
          
          {emergencyLocation && (
            <Text style={styles.emergencyLocation}>
              Location: {emergencyLocation.latitude.toFixed(6)}, {emergencyLocation.longitude.toFixed(6)}
            </Text>
          )}
          
          <View style={styles.emergencyModalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#FF0000' }]}
              onPress={cancelEmergency}
            >
              <Text style={styles.modalButtonText}>Cancel Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>Real-Time Safety Monitoring</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSafetyStatus()}
        {renderSafetyMetrics()}
        {renderSafetyAlerts()}
        {renderEmergencyButton()}
      </ScrollView>

      {renderEmergencyModal()}
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
    flex: 1,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  safetyStatusCard: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  safetyStatusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  safetyStatusText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  safetyScore: {
    fontSize: 16,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  alertsContainer: {
    maxHeight: 300,
  },
  alertItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  noAlerts: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  emergencyButton: {
    backgroundColor: '#FF0000',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emergencyButtonActive: {
    backgroundColor: '#FF4444',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
  },
  emergencyModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF0000',
    marginTop: 12,
    textAlign: 'center',
  },
  emergencyModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  emergencyLocation: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emergencyModalButtons: {
    width: '100%',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RealTimeSafetyMonitoring; 