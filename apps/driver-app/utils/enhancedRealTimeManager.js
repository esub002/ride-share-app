/**
 * Enhanced Real-Time Manager for Driver App
 * Integrates analytics, location tracking, communication, and advanced real-time features
 */

import { io } from 'socket.io-client';
import { Alert, Vibration, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

class EnhancedRealTimeManager {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.connectionTimeout = 10000;
    this.connectionState = 'disconnected';
    this.eventListeners = new Map();
    this.locationTracker = null;
    this.analyticsTracker = null;
    this.communicationManager = null;
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.connectionTimeoutId = null;
    this.lastHeartbeat = null;
    this.userId = null;
    this.userRole = null;
    this.currentRide = null;
    this.analyticsData = null;
    this.locationHistory = [];
    this.activeGeofences = new Set();
    this.voiceCall = null;
    this.messageQueue = [];
    this.typingStatus = false;
    
    // Performance dashboard data
    this.performanceMetrics = {
      system: {},
      application: {},
      business: {},
      realtime: {}
    };
    
    // Location tracking data
    this.currentLocation = null;
    this.locationAccuracy = 0;
    this.locationSpeed = 0;
    this.locationHeading = 0;
    this.geofenceEvents = [];
    
    // Communication data
    this.activeCalls = new Map();
    this.messageHistory = new Map();
    this.typingIndicators = new Map();
    
    this.initialize();
  }

  async initialize() {
    await this.setupNotifications();
    await this.setupLocationTracking();
    this.setupEventListeners();
    console.log('✅ Enhanced Real-Time Manager initialized');
  }

  async setupNotifications() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }

  async setupLocationTracking() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permissions not granted');
        return;
      }

      // Start location tracking
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );
    } catch (error) {
      console.error('Error setting up location tracking:', error);
    }
  }

  handleLocationUpdate(location) {
    this.currentLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      heading: location.coords.heading,
      timestamp: new Date().toISOString()
    };

    // Update location history
    this.locationHistory.push(this.currentLocation);
    if (this.locationHistory.length > 1000) {
      this.locationHistory = this.locationHistory.slice(-1000);
    }

    // Send location update to server
    if (this.socket && this.socket.connected) {
      this.socket.emit('location:update', {
        userId: this.userId,
        ...this.currentLocation
      });
    }

    this.emit('location:updated', this.currentLocation);
  }

  // Initialize socket connection
  async connect(baseURL = 'http://10.1.10.243:3000') {
    if (this.socket?.connected || this.isConnecting) {
      console.log('🔌 Socket already connected or connecting');
      return;
    }

    try {
      this.isConnecting = true;
      this.connectionState = 'connecting';
      
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const parsed = JSON.parse(userData);
        this.userId = parsed.id;
        this.userRole = parsed.role;
      }
      
      this.socket = io(baseURL, {
        transports: ['websocket', 'polling'],
        reconnection: false, // We'll handle reconnection manually
        timeout: this.connectionTimeout,
        forceNew: true,
        auth: token ? { token } : {},
        query: {
          clientType: 'driver',
          version: '2.0.0',
          features: 'enhanced'
        }
      });

      this.setupSocketEventListeners();
      this.startConnectionTimeout();
      
    } catch (error) {
      console.error('🔌 Socket connection error:', error);
      this.handleConnectionError(error);
    }
  }

  // Setup all event listeners
  setupSocketEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Connected to enhanced real-time server');
      this.handleConnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      this.handleDisconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.handleConnectionError(error);
    });

    // Performance dashboard events
    this.socket.on('dashboard:metrics', (data) => {
      this.performanceMetrics = data.metrics;
      this.emit('performance:updated', data.metrics);
    });

    this.socket.on('dashboard:alerts', (alerts) => {
      this.emit('performance:alerts', alerts);
      this.showPerformanceAlerts(alerts);
    });

    // Location events
    this.socket.on('location:update', (data) => {
      this.emit('location:updated', data);
    });

    this.socket.on('geofence:entered', (data) => {
      this.handleGeofenceEntered(data);
    });

    this.socket.on('geofence:exited', (data) => {
      this.handleGeofenceExited(data);
    });

    // Communication events
    this.socket.on('call:incoming', (data) => {
      this.handleIncomingCall(data);
    });

    this.socket.on('call:accepted', (data) => {
      this.handleCallAccepted(data);
    });

    this.socket.on('call:rejected', (data) => {
      this.handleCallRejected(data);
    });

    this.socket.on('call:ended', (data) => {
      this.handleCallEnded(data);
    });

    this.socket.on('message:received', (data) => {
      this.handleMessageReceived(data);
    });

    this.socket.on('typing:started', (data) => {
      this.handleTypingStarted(data);
    });

    this.socket.on('typing:stopped', (data) => {
      this.handleTypingStopped(data);
    });

    // Ride events
    this.socket.on('ride:request', (data) => {
      this.handleRideRequest(data);
    });

    this.socket.on('ride:statusUpdate', (data) => {
      this.handleRideStatusUpdate(data);
    });

    this.socket.on('ride:cancelled', (data) => {
      this.handleRideCancelled(data);
    });

    // System events
    this.socket.on('system:maintenance', (data) => {
      this.handleSystemMaintenance(data);
    });

    this.socket.on('system:update', (data) => {
      this.handleSystemUpdate(data);
    });

    // Heartbeat
    this.socket.on('heartbeat', () => {
      this.lastHeartbeat = Date.now();
      this.socket.emit('heartbeat:ack');
    });
  }

  // Handle successful connection
  handleConnect() {
    this.isConnecting = false;
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.clearConnectionTimeout();
    this.startHeartbeat();
    this.emit('connected');
  }

  // Handle disconnection
  handleDisconnect(reason) {
    this.connectionState = 'disconnected';
    this.isConnecting = false;
    this.stopHeartbeat();
    this.clearConnectionTimeout();
    
    // Don't auto-reconnect for intentional disconnects
    if (reason === 'io client disconnect' || reason === 'io server disconnect') {
      console.log('🔌 Intentional disconnect, not reconnecting');
      this.emit('disconnected', { reason, intentional: true });
      return;
    }

    // Auto-reconnect for network issues
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('🔌 Max reconnection attempts reached');
      this.emit('reconnectFailed');
      Alert.alert(
        'Connection Lost',
        'Unable to reconnect to server. Please check your internet connection and restart the app.',
        [{ text: 'OK' }]
      );
    }
  }

  // Handle connection errors
  handleConnectionError(error) {
    this.isConnecting = false;
    this.connectionState = 'disconnected';
    this.clearConnectionTimeout();
    
    console.error('🔌 Connection error:', error);
    this.emit('connectionError', error);
    
    // Schedule reconnection for network errors
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  // Schedule reconnection
  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    this.connectionState = 'reconnecting';
    
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`🔌 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.emit('reconnecting', { attempt: this.reconnectAttempts });
      this.connect();
    }, delay);
  }

  // Start connection timeout
  startConnectionTimeout() {
    this.connectionTimeoutId = setTimeout(() => {
      console.error('🔌 Connection timeout');
      this.handleConnectionError(new Error('Connection timeout'));
    }, this.connectionTimeout);
  }

  // Clear connection timeout
  clearConnectionTimeout() {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
  }

  // Start heartbeat
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('heartbeat');
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    this.clearConnectionTimeout();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionState = 'disconnected';
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    console.log('🔌 Socket disconnected');
    this.emit('disconnected', { reason: 'manual', intentional: true });
  }

  // Event handling methods
  emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // Socket emit wrapper
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue message for later if not connected
      this.messageQueue.push({ event, data, timestamp: Date.now() });
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.socket?.connected || false,
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  // Update authentication token
  async updateToken(token) {
    await AsyncStorage.setItem('authToken', token);
    if (this.socket && this.socket.connected) {
      this.socket.emit('auth:update', { token });
    }
  }

  // Location methods
  updateLocation(latitude, longitude) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('location:update', {
        userId: this.userId,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Driver availability methods
  updateAvailability(available) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(available ? 'driver:available' : 'driver:unavailable', {
        driverId: this.userId,
        location: this.currentLocation,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Ride methods
  acceptRide(rideId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ride:accept', {
        rideId,
        driverId: this.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  rejectRide(rideId, reason = '') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ride:reject', {
        rideId,
        driverId: this.userId,
        reason,
        timestamp: new Date().toISOString()
      });
    }
  }

  updateRideStatus(rideId, status) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ride:status', {
        rideId,
        driverId: this.userId,
        status,
        location: this.currentLocation,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Communication methods
  sendMessage(rideId, message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:send', {
        rideId,
        senderId: this.userId,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  startTyping(rideId) {
    if (this.socket && this.socket.connected && !this.typingStatus) {
      this.typingStatus = true;
      this.socket.emit('typing:start', {
        rideId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  stopTyping(rideId) {
    if (this.socket && this.socket.connected && this.typingStatus) {
      this.typingStatus = false;
      this.socket.emit('typing:stop', {
        rideId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Call methods
  initiateCall(rideId, callType = 'voice') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:initiate', {
        rideId,
        callerId: this.userId,
        callType,
        timestamp: new Date().toISOString()
      });
    }
  }

  acceptCall(callId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:accept', {
        callId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  rejectCall(callId, reason = '') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:reject', {
        callId,
        userId: this.userId,
        reason,
        timestamp: new Date().toISOString()
      });
    }
  }

  endCall(callId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:end', {
        callId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Event handlers
  handleGeofenceEntered(data) {
    this.geofenceEvents.push(data);
    this.emit('geofence:entered', data);
    
    // Show notification
    this.showNotification('Geofence Entered', `You entered ${data.metadata.geofenceName}`);
    
    // Vibrate device
    if (Platform.OS === 'ios') {
      Vibration.vibrate();
    } else {
      Vibration.vibrate(500);
    }
  }

  handleGeofenceExited(data) {
    this.geofenceEvents.push(data);
    this.emit('geofence:exited', data);
    
    // Show notification
    this.showNotification('Geofence Exited', `You exited ${data.metadata.geofenceName}`);
  }

  handleRideRequest(data) {
    this.emit('ride:request', data);
    
    // Show notification with sound and vibration
    this.showNotification('New Ride Request', 'Tap to view details', {
      sound: true,
      vibrate: true
    });
  }

  handleRideStatusUpdate(data) {
    this.emit('ride:statusUpdate', data);
  }

  handleRideCancelled(data) {
    this.emit('ride:cancelled', data);
    
    // Show notification
    this.showNotification('Ride Cancelled', 'The ride has been cancelled');
  }

  handleIncomingCall(data) {
    this.emit('call:incoming', data);
    
    // Show call notification
    this.showNotification('Incoming Call', 'Tap to answer', {
      sound: true,
      vibrate: true
    });
  }

  handleCallAccepted(data) {
    this.emit('call:accepted', data);
  }

  handleCallRejected(data) {
    this.emit('call:rejected', data);
  }

  handleCallEnded(data) {
    this.emit('call:ended', data);
  }

  handleMessageReceived(data) {
    this.emit('message:received', data);
    
    // Show notification
    this.showNotification('New Message', data.message);
  }

  handleTypingStarted(data) {
    this.emit('typing:started', data);
  }

  handleTypingStopped(data) {
    this.emit('typing:stopped', data);
  }

  handleSystemMaintenance(data) {
    this.emit('system:maintenance', data);
    
    // Show notification
    this.showNotification('System Maintenance', data.message);
  }

  handleSystemUpdate(data) {
    this.emit('system:update', data);
    
    // Show notification
    this.showNotification('System Update', 'A new update is available');
  }

  // Performance dashboard handlers
  showPerformanceAlerts(alerts) {
    alerts.forEach(alert => {
      this.showNotification('System Alert', alert.message, {
        sound: alert.severity === 'critical'
      });
    });
  }

  // Utility methods
  async showNotification(title, body, options = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: options.sound ? 'default' : undefined
        },
        trigger: null // Show immediately
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Get current data
  getCurrentLocation() {
    return this.currentLocation;
  }

  getLocationHistory(limit = 100) {
    return this.locationHistory.slice(-limit);
  }

  getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  getGeofenceEvents(limit = 50) {
    return this.geofenceEvents.slice(-limit);
  }

  getMessageHistory(rideId) {
    return this.messageHistory.get(rideId) || [];
  }

  getActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  // Cleanup
  destroy() {
    this.disconnect();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.eventListeners.clear();
    this.locationHistory = [];
    this.geofenceEvents = [];
    this.messageHistory.clear();
    this.activeCalls.clear();
    this.typingIndicators.clear();
    
    console.log('✅ Enhanced Real-Time Manager destroyed');
  }
}

export default EnhancedRealTimeManager; 