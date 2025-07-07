import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

// Import our enhanced services
import enhancedRealTimeManager from '../utils/enhancedRealTimeManager';
import apiService from '../utils/api';

const { width, height } = Dimensions.get('window');

const RealTimePerformanceDashboard = () => {
  // State management
  const [performanceMetrics, setPerformanceMetrics] = useState({
    system: {
      cpu: 0,
      memory: 0,
      network: 0,
      battery: 0,
    },
    application: {
      responseTime: 0,
      errorRate: 0,
      activeConnections: 0,
      cacheHitRate: 0,
    },
    business: {
      ridesCompleted: 0,
      earnings: 0,
      rating: 0,
      onlineTime: 0,
    },
    realtime: {
      latency: 0,
      messageDelivery: 0,
      locationAccuracy: 0,
      connectionQuality: 0,
    },
  });

  const [alerts, setAlerts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [historicalData, setHistoricalData] = useState({
    responseTime: [],
    earnings: [],
    rating: [],
    latency: [],
  });

  // Animation refs
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const alertAnimation = useRef(new Animated.Value(0)).current;

  // Refs for cleanup
  const metricsInterval = useRef(null);
  const alertCheckInterval = useRef(null);

  // Initialize dashboard
  useEffect(() => {
    initializeDashboard();
    setupEventListeners();
    startMetricsCollection();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize dashboard
  const initializeDashboard = async () => {
    try {
      // Connect to real-time manager
      await enhancedRealTimeManager.connect();
      
      // Load initial metrics
      await loadInitialMetrics();
      
      // Load historical data
      await loadHistoricalData();
      
      console.log('📊 Real-time performance dashboard initialized');
    } catch (error) {
      console.error('📊 Failed to initialize dashboard:', error);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // Performance metrics updates
    enhancedRealTimeManager.on('performance:updated', (metrics) => {
      setPerformanceMetrics(metrics);
      updateHistoricalData(metrics);
    });

    // Performance alerts
    enhancedRealTimeManager.on('performance:alerts', (newAlerts) => {
      handlePerformanceAlerts(newAlerts);
    });

    // System health updates
    enhancedRealTimeManager.on('system:health', (health) => {
      updateSystemHealth(health);
    });

    // Connection quality updates
    enhancedRealTimeManager.on('connection:quality', (quality) => {
      updateConnectionQuality(quality);
    });
  };

  // Start metrics collection
  const startMetricsCollection = () => {
    // Update metrics every 5 seconds
    metricsInterval.current = setInterval(async () => {
      await collectMetrics();
    }, 5000);

    // Check for alerts every 10 seconds
    alertCheckInterval.current = setInterval(async () => {
      await checkForAlerts();
    }, 10000);
  };

  // Collect current metrics
  const collectMetrics = async () => {
    try {
      const metrics = await apiService.getPerformanceMetrics();
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('📊 Error collecting metrics:', error);
    }
  };

  // Load initial metrics
  const loadInitialMetrics = async () => {
    try {
      const metrics = await apiService.getPerformanceMetrics();
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('📊 Error loading initial metrics:', error);
    }
  };

  // Load historical data
  const loadHistoricalData = async () => {
    try {
      const data = await apiService.getHistoricalMetrics();
      setHistoricalData(data);
    } catch (error) {
      console.error('📊 Error loading historical data:', error);
    }
  };

  // Update historical data
  const updateHistoricalData = (metrics) => {
    const now = Date.now();
    
    setHistoricalData(prev => ({
      responseTime: [...prev.responseTime.slice(-19), { time: now, value: metrics.application.responseTime }],
      earnings: [...prev.earnings.slice(-19), { time: now, value: metrics.business.earnings }],
      rating: [...prev.rating.slice(-19), { time: now, value: metrics.business.rating }],
      latency: [...prev.latency.slice(-19), { time: now, value: metrics.realtime.latency }],
    }));
  };

  // Handle performance alerts
  const handlePerformanceAlerts = (newAlerts) => {
    setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    
    // Trigger haptic feedback for critical alerts
    newAlerts.forEach(alert => {
      if (alert.severity === 'critical') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlertNotification(alert);
      } else if (alert.severity === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    });

    // Trigger alert animation
    triggerAlertAnimation();
  };

  // Show alert notification
  const showAlertNotification = (alert) => {
    Alert.alert(
      'Performance Alert',
      alert.message,
      [{ text: 'OK' }]
    );
  };

  // Update system health
  const updateSystemHealth = (health) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      system: {
        ...prev.system,
        ...health,
      },
    }));
  };

  // Update connection quality
  const updateConnectionQuality = (quality) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      realtime: {
        ...prev.realtime,
        connectionQuality: quality,
      },
    }));
  };

  // Check for alerts
  const checkForAlerts = async () => {
    try {
      const alerts = await apiService.checkPerformanceAlerts();
      if (alerts.length > 0) {
        handlePerformanceAlerts(alerts);
      }
    } catch (error) {
      console.error('📊 Error checking alerts:', error);
    }
  };

  // Toggle dashboard expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(slideAnimation, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
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

  // Get metric color based on value
  const getMetricColor = (value, thresholds) => {
    if (value >= thresholds.critical) return '#FF4444';
    if (value >= thresholds.warning) return '#FFAA00';
    return '#00AA00';
  };

  // Get connection quality text
  const getConnectionQualityText = (quality) => {
    if (quality >= 90) return 'Excellent';
    if (quality >= 70) return 'Good';
    if (quality >= 50) return 'Fair';
    return 'Poor';
  };

  // Get connection quality color
  const getConnectionQualityColor = (quality) => {
    if (quality >= 90) return '#00AA00';
    if (quality >= 70) return '#00AA00';
    if (quality >= 50) return '#FFAA00';
    return '#FF4444';
  };

  // Cleanup
  const cleanup = () => {
    if (metricsInterval.current) clearInterval(metricsInterval.current);
    if (alertCheckInterval.current) clearInterval(alertCheckInterval.current);
    
    enhancedRealTimeManager.off('performance:updated');
    enhancedRealTimeManager.off('performance:alerts');
    enhancedRealTimeManager.off('system:health');
    enhancedRealTimeManager.off('connection:quality');
  };

  // Render metric card
  const renderMetricCard = (title, value, unit, color, icon) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>
        {value}{unit}
      </Text>
    </View>
  );

  // Render system metrics
  const renderSystemMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Health</Text>
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'CPU',
          performanceMetrics.system.cpu,
          '%',
          getMetricColor(performanceMetrics.system.cpu, { warning: 80, critical: 95 }),
          'hardware-chip'
        )}
        {renderMetricCard(
          'Memory',
          performanceMetrics.system.memory,
          '%',
          getMetricColor(performanceMetrics.system.memory, { warning: 85, critical: 95 }),
          'phone-portrait'
        )}
        {renderMetricCard(
          'Network',
          performanceMetrics.system.network,
          'Mbps',
          getMetricColor(performanceMetrics.system.network, { warning: 5, critical: 1 }),
          'wifi'
        )}
        {renderMetricCard(
          'Battery',
          performanceMetrics.system.battery,
          '%',
          getMetricColor(100 - performanceMetrics.system.battery, { warning: 20, critical: 10 }),
          'battery-charging'
        )}
      </View>
    </View>
  );

  // Render application metrics
  const renderApplicationMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Application Performance</Text>
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Response Time',
          performanceMetrics.application.responseTime,
          'ms',
          getMetricColor(performanceMetrics.application.responseTime, { warning: 500, critical: 1000 }),
          'speedometer'
        )}
        {renderMetricCard(
          'Error Rate',
          performanceMetrics.application.errorRate,
          '%',
          getMetricColor(performanceMetrics.application.errorRate, { warning: 5, critical: 10 }),
          'warning'
        )}
        {renderMetricCard(
          'Connections',
          performanceMetrics.application.activeConnections,
          '',
          '#007AFF',
          'people'
        )}
        {renderMetricCard(
          'Cache Hit',
          performanceMetrics.application.cacheHitRate,
          '%',
          getMetricColor(100 - performanceMetrics.application.cacheHitRate, { warning: 20, critical: 40 }),
          'flash'
        )}
      </View>
    </View>
  );

  // Render business metrics
  const renderBusinessMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Business Metrics</Text>
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Rides',
          performanceMetrics.business.ridesCompleted,
          '',
          '#007AFF',
          'car'
        )}
        {renderMetricCard(
          'Earnings',
          `$${performanceMetrics.business.earnings}`,
          '',
          '#00AA00',
          'cash'
        )}
        {renderMetricCard(
          'Rating',
          performanceMetrics.business.rating,
          '',
          getMetricColor(5 - performanceMetrics.business.rating, { warning: 1, critical: 2 }),
          'star'
        )}
        {renderMetricCard(
          'Online Time',
          `${Math.floor(performanceMetrics.business.onlineTime / 60)}m`,
          '',
          '#007AFF',
          'time'
        )}
      </View>
    </View>
  );

  // Render real-time metrics
  const renderRealtimeMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Real-time Performance</Text>
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Latency',
          performanceMetrics.realtime.latency,
          'ms',
          getMetricColor(performanceMetrics.realtime.latency, { warning: 100, critical: 200 }),
          'flash'
        )}
        {renderMetricCard(
          'Message Delivery',
          performanceMetrics.realtime.messageDelivery,
          '%',
          getMetricColor(100 - performanceMetrics.realtime.messageDelivery, { warning: 5, critical: 10 }),
          'mail'
        )}
        {renderMetricCard(
          'Location Accuracy',
          performanceMetrics.realtime.locationAccuracy,
          'm',
          getMetricColor(performanceMetrics.realtime.locationAccuracy, { warning: 20, critical: 50 }),
          'location'
        )}
        {renderMetricCard(
          'Connection',
          getConnectionQualityText(performanceMetrics.realtime.connectionQuality),
          '',
          getConnectionQualityColor(performanceMetrics.realtime.connectionQuality),
          'cellular'
        )}
      </View>
    </View>
  );

  // Render alerts
  const renderAlerts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      <ScrollView style={styles.alertsContainer} showsVerticalScrollIndicator={false}>
        {alerts.map((alert, index) => (
          <Animated.View
            key={index}
            style={[
              styles.alertItem,
              { borderLeftColor: alert.severity === 'critical' ? '#FF4444' : '#FFAA00' },
              { transform: [{ scale: alertAnimation }] }
            ]}
          >
            <View style={styles.alertHeader}>
              <Ionicons
                name={alert.severity === 'critical' ? 'warning' : 'information-circle'}
                size={16}
                color={alert.severity === 'critical' ? '#FF4444' : '#FFAA00'}
              />
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertTime}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.alertMessage}>{alert.message}</Text>
          </Animated.View>
        ))}
        {alerts.length === 0 && (
          <Text style={styles.noAlerts}>No recent alerts</Text>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpansion}>
        <View style={styles.headerContent}>
          <Ionicons name="analytics" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Performance Dashboard</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#007AFF"
          />
        </View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          {
            maxHeight: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, height * 0.7],
            }),
            opacity: slideAnimation,
          },
        ]}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderSystemMetrics()}
          {renderApplicationMetrics()}
          {renderBusinessMetrics()}
          {renderRealtimeMetrics()}
          {renderAlerts()}
        </ScrollView>
      </Animated.View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  content: {
    overflow: 'hidden',
  },
  scrollView: {
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
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  alertsContainer: {
    maxHeight: 200,
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
  alertTitle: {
    fontSize: 14,
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
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  noAlerts: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default RealTimePerformanceDashboard; 