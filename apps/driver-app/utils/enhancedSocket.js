import { io } from 'socket.io-client';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class EnhancedSocket {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.connectionTimeout = 10000;
    this.eventListeners = new Map();
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, reconnecting
    this.lastHeartbeat = null;
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.connectionTimeoutId = null;
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
      
      this.socket = io(baseURL, {
        transports: ['websocket', 'polling'],
        reconnection: false, // We'll handle reconnection manually
        timeout: this.connectionTimeout,
        forceNew: true,
        auth: token ? { token } : {},
        query: {
          clientType: 'driver',
          version: '1.0.0'
        }
      });

      this.setupEventListeners();
      this.startConnectionTimeout();
      
    } catch (error) {
      console.error('🔌 Socket connection error:', error);
      this.handleConnectionError(error);
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected successfully');
      this.handleConnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.handleDisconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      this.handleConnectionError(error);
    });

    // Authentication events
    this.socket.on('auth:success', (data) => {
      console.log('🔐 Authentication successful:', data);
      this.emit('authSuccess', data);
    });

    this.socket.on('auth:error', (error) => {
      console.error('🔐 Authentication failed:', error);
      this.emit('authError', error);
    });

    // Ride request events
    this.socket.on('ride:request', (data) => {
      console.log('🚗 New ride request received:', data);
      this.emit('newRideRequest', data);
    });

    this.socket.on('ride:cancelled', (data) => {
      console.log('❌ Ride request cancelled:', data);
      this.emit('rideCancelled', data);
    });

    this.socket.on('ride:expired', (data) => {
      console.log('⏰ Ride request expired:', data);
      this.emit('rideExpired', data);
    });

    // Status updates
    this.socket.on('ride:statusUpdate', (data) => {
      console.log('📊 Ride status updated:', data);
      this.emit('rideStatusUpdate', data);
    });

    // System events
    this.socket.on('system:maintenance', (data) => {
      console.log('🔧 System maintenance:', data);
      this.emit('systemMaintenance', data);
    });

    this.socket.on('system:update', (data) => {
      console.log('🔄 System update available:', data);
      this.emit('systemUpdate', data);
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
      if (this.connectionState === 'connecting') {
        console.error('🔌 Connection timeout');
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.connectionTimeout);
  }

  // Clear connection timeout
  clearConnectionTimeout() {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
  }

  // Start heartbeat monitoring
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat');
        
        // Check if we haven't received a heartbeat in 30 seconds
        if (this.lastHeartbeat && Date.now() - this.lastHeartbeat > 30000) {
          console.warn('🔌 No heartbeat received, reconnecting...');
          this.socket.disconnect();
        }
      }
    }, 15000); // Send heartbeat every 15 seconds
  }

  // Stop heartbeat monitoring
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
    
    this.isConnecting = false;
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    
    console.log('🔌 Socket disconnected');
  }

  // Emit event to socket
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`🔌 Cannot emit ${event}: socket not connected`);
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit event to app listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
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
    if (this.socket?.connected) {
      this.socket.auth = { token };
      this.socket.emit('auth:update', { token });
    }
  }

  // Send driver location update
  updateLocation(latitude, longitude) {
    this.emit('driver:location', { latitude, longitude });
  }

  // Send driver availability status
  updateAvailability(available) {
    this.emit('driver:availability', { available });
  }

  // Accept ride request
  acceptRide(rideId) {
    this.emit('ride:accept', { rideId });
  }

  // Reject ride request
  rejectRide(rideId, reason = '') {
    this.emit('ride:reject', { rideId, reason });
  }

  // Update ride status
  updateRideStatus(rideId, status) {
    this.emit('ride:status', { rideId, status });
  }
}

// Create singleton instance
const enhancedSocket = new EnhancedSocket();

export default enhancedSocket; 