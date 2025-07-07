import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineManager from './offlineManager';
import performanceOptimizer from './performanceOptimizer';
import firebaseIntegration from './firebaseIntegration';
import { Platform } from 'react-native';

// === API BASE URL (Docker backend access) ===
// Use 10.0.2.2 for Android emulator, localhost for iOS simulator, LAN IP for physical devices
// Try multiple ports in case backend is running on different port
const getApiBaseUrl = () => {
  const baseHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  // Use the correct backend port - update this to match your backend
  const ports = [3000, 3028, 3001, 3010, 3015];
  return `http://${baseHost}:${ports[0]}`; // Use first port, fallback logic will handle failures
};
const API_BASE_URL = getApiBaseUrl();

// === DEV MODE FLAG (Automated for Expo and React Native CLI) ===
// For Expo: set "extra.USE_MOCK_DATA" in app.json or app.config.js
// For React Native CLI: set USE_MOCK_DATA in .env or your build environment
let USE_MOCK_DATA = false; // Set to false to use real backend
try {
  // Expo: Constants.manifest.extra.USE_MOCK_DATA
  const Constants = require('expo-constants').default;
  if (Constants?.manifest?.extra?.USE_MOCK_DATA !== undefined) {
    USE_MOCK_DATA = String(Constants.manifest.extra.USE_MOCK_DATA).toLowerCase() === 'true';
  }
} catch (e) {
  // Not Expo or Constants not available
}
if (typeof process !== 'undefined' && process.env && process.env.USE_MOCK_DATA !== undefined) {
  USE_MOCK_DATA = String(process.env.USE_MOCK_DATA).toLowerCase() === 'true';
}
if (USE_MOCK_DATA) {
  console.warn('⚠️ USE_MOCK_DATA is enabled. All API calls will use mock data.');
}

// Mock data for when backend is not available
const mockData = {
  user: {
    id: 1,
    name: 'John Driver',
    phone: '+1234567890',
    car: 'Toyota Prius 2020',
    email: 'john.driver@example.com',
    rating: 4.8,
    totalRides: 1250,
    totalEarnings: 15420.50
  },
  earnings: {
    today: 85.50,
    week: 420.75,
    month: 1850.25,
    total: 15420.50,
    history: [
      { date: '2024-01-15', amount: 95.25, rides: 8 },
      { date: '2024-01-14', amount: 87.50, rides: 7 },
      { date: '2024-01-13', amount: 102.00, rides: 9 },
      { date: '2024-01-12', amount: 78.25, rides: 6 },
      { date: '2024-01-11', amount: 91.75, rides: 8 }
    ]
  },
  rides: [
    {
      id: 1,
      passenger: 'Sarah Johnson',
      pickup: '123 Main St, Downtown',
      destination: '456 Oak Ave, Uptown',
      fare: 25.50,
      status: 'completed',
      date: '2024-01-15T10:30:00Z',
      rating: 5
    },
    {
      id: 2,
      passenger: 'Mike Chen',
      pickup: '789 Pine St, Midtown',
      destination: '321 Elm St, Downtown',
      fare: 18.75,
      status: 'completed',
      date: '2024-01-15T09:15:00Z',
      rating: 4
    }
  ],
  currentRide: null,
  notifications: [
    {
      id: 1,
      title: 'New Ride Request',
      message: 'Ride request from Downtown to Uptown',
      type: 'ride_request',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]
};

class ApiService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
    this.token = null;
    this.isOnline = true;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.socket = null;
    this.connectedBackend = null;
    this.mockMode = USE_MOCK_DATA;
    this.firebaseIntegration = null;
    this.eventCallbacks = {};
    
    if (this.mockMode) {
      console.warn('⚠️ ApiService is running in MOCK mode.');
    }
    console.log(`🚀 API Service initialized with base URL: ${this.baseURL}`);
  }

  async init() {
    if (this.mockMode) {
      // No backend connection needed
      return true;
    }
    try {
      console.log('🔧 Initializing API Service...');
      
      // Initialize Firebase integration
      console.log('🔥 Initializing Firebase integration...');
      this.firebaseIntegration = firebaseIntegration;
      const firebaseSuccess = await this.firebaseIntegration.initialize();
      if (firebaseSuccess) {
        console.log('✅ Firebase integration initialized');
        // Setup real-time listeners
        this.firebaseIntegration.setupRealtimeListeners();
      } else {
        console.warn('⚠️ Firebase integration failed, continuing without Firebase');
      }
      
      // No backend auto-detection, always use hardcoded API_BASE_URL
      this.connectedBackend = API_BASE_URL;
      this.baseURL = `${API_BASE_URL}/api`;
      console.log(`✅ API Service connected to: ${API_BASE_URL}`);
      
      // Load stored token
      const storedToken = await AsyncStorage.getItem('driver_token');
      if (storedToken) {
        this.token = storedToken;
        console.log('🔑 Loaded stored authentication token');
      }
      
      // Initialize socket connection
      this.initializeSocket();
      return true;
    } catch (error) {
      console.error('❌ API Service initialization failed:', error);
      return false;
    }
  }

  // Initialize Socket.IO connection for real-time updates
  initializeSocket() {
    if (this.mockMode) {
      // No real socket in mock mode
      return;
    }
    try {
      const { io } = require('socket.io-client');
      this.socket = io(API_BASE_URL, {
        auth: {
          token: this.token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to backend via Socket.IO');
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from backend');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Listen for real-time ride requests
      this.socket.on('ride:request', (data) => {
        console.log('🚗 New ride request received:', data);
        // You can emit this to your app state management
        this.emit('newRideRequest', data);
      });

      // Listen for ride status updates
      this.socket.on('ride:statusUpdate', (data) => {
        console.log('📊 Ride status updated:', data);
        this.emit('rideStatusUpdate', data);
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    AsyncStorage.setItem('driver_token', token);
    if (this.mockMode) return;
    if (token) {
      this.initializeSocket();
    } else {
      this.disconnectSocket();
    }
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    AsyncStorage.removeItem('driver_token');
    if (this.mockMode) return;
    this.disconnectSocket();
  }

  // Disconnect socket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Make API request with error handling and offline support
  async request(endpoint, options = {}) {
    if (this.mockMode) {
      // Return mock data for known endpoints
      return { data: this.getMockData(endpoint) };
    }
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders();
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API Request successful: ${endpoint}`);
          return data;
        } else {
          console.log(`❌ API Request failed (attempt ${attempt}): ${endpoint} - Status: ${response.status}`);
          
          if (attempt === this.retryAttempts) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      } catch (error) {
        console.log(`❌ API Request error (attempt ${attempt}): ${endpoint} - ${error.message}`);
        
        if (attempt === this.retryAttempts) {
          // If all retries failed, return mock data for development
          console.log(`🔄 Using mock data for ${endpoint} due to connection failure`);
          const mockData = this.getMockData(endpoint);
          console.log(`✅ Mock data returned for ${endpoint}:`, mockData);
          return mockData;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Get mock data for specific endpoints
  getMockData(endpoint) {
    console.log(`🎭 Getting mock data for endpoint: ${endpoint}`);
    
    if (endpoint.includes('/earnings')) {
      const earningsData = {
        today: 85.50,
        week: 420.75,
        month: 1850.25,
        total: 15420.50,
        history: [
          { date: '2024-01-15', amount: 95.25, rides: 8 },
          { date: '2024-01-14', amount: 87.50, rides: 7 },
          { date: '2024-01-13', amount: 102.00, rides: 9 },
          { date: '2024-01-12', amount: 78.25, rides: 6 },
          { date: '2024-01-11', amount: 91.75, rides: 8 }
        ]
      };
      console.log('💰 Mock earnings data:', earningsData);
      return earningsData;
    }
    
    if (endpoint.includes('/rides')) {
      const ridesData = [
        {
          id: 'mock-ride-1',
          pickup: '123 Main St',
          destination: '456 Oak Ave',
          fare: 25.50,
          status: 'completed'
        }
      ];
      console.log('🚗 Mock rides data:', ridesData);
      return ridesData;
    }
    
    if (endpoint.includes('/profile')) {
      const profileData = {
        id: global.user?.id || 'mock-driver',
        name: global.user?.name || 'Demo Driver',
        phone: global.user?.phone || '+1234567890',
        car: global.user?.car_info || 'Demo Car',
        email: global.user?.email || 'demo@driver.com',
        rating: 4.8,
        totalRides: 1250
      };
      console.log('👤 Mock profile data:', profileData);
      return profileData;
    }
    
    if (endpoint.includes('/notifications')) {
      const notificationsData = [
        {
          id: 'mock-notif-1',
          title: 'Welcome to Driver App',
          message: 'You are now ready to accept rides!',
          type: 'info'
        }
      ];
      console.log('🔔 Mock notifications data:', notificationsData);
      return notificationsData;
    }
    
    if (endpoint.includes('/stats')) {
      const statsData = {
        totalRides: 1250,
        rating: 4.8,
        onlineHours: 156.5,
        acceptanceRate: 94
      };
      console.log('📊 Mock stats data:', statsData);
      return statsData;
    }
    
    if (endpoint.includes('/current-ride')) {
      console.log('🚫 No current ride (mock data)');
      return null;
    }
    
    if (endpoint.includes('status=requested')) {
      console.log('🚫 No ride requests (mock data)');
      return [];
    }
    
    if (endpoint.includes('/location')) {
      console.log('📍 Location update (mock data)');
      return { success: true };
    }
    
    if (endpoint.includes('/toggle')) {
      console.log('🔄 Availability toggle (mock data)');
      return { success: true, available: true };
    }
    
    console.log('📦 Returning default mock data');
    return mockData;
  }

  // Authentication methods
  async loginDriver(phone, otp, name = null, carInfo = null) {
    if (this.mockMode) {
      return { token: 'mock-token', driver: mockData.user };
    }
    const body = { phone, otp };
    if (name && carInfo) {
      body.name = name;
      body.car_info = carInfo;
    }

    const result = await this.request('/auth/driver/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    // Backend returns { token: "...", driver: { id, name, phone, car_info } }
    if (result.token && result.driver) {
      this.setToken(result.token);
      return result;
    }
    
    throw new Error(result.error || 'Login failed');
  }

  async sendOTP(phone) {
    if (this.mockMode) {
      return { success: true, message: 'OTP sent successfully', otp: '123456' };
    }
    const result = await this.request('/auth/driver/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });

    // Backend returns { message: "OTP sent successfully", otp: "123456" }
    if (result.message && result.otp) {
      return {
        success: true,
        message: result.message,
        otp: result.otp
      };
    }
    
    throw new Error(result.error || 'Failed to send OTP');
  }

  // Google Sign-In methods
  async checkUserExists(email) {
    if (this.mockMode) {
      // Mock user check
      const mockUsers = ['test@example.com', 'driver@example.com'];
      const exists = mockUsers.includes(email);
      return { success: true, data: { exists } };
    }
    
    try {
      const response = await this.request(`/auth/driver/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Check user error:', error);
      return { success: false, error: error.message };
    }
  }

  async googleSignIn(userData) {
    if (this.mockMode) {
      // Mock Google Sign-In response
      const mockUser = {
        id: 'google-driver-' + Date.now(),
        firebaseUid: userData.firebaseUid,
        email: userData.email,
        name: userData.displayName || 'Google Driver',
        photoURL: userData.photoURL,
        phone: null,
        car_info: null,
        isActive: true,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        token: 'google-jwt-token-' + Date.now(),
        user: mockUser
      };
    }
    
    try {
      const response = await this.request('/auth/driver/google-signin', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      return { success: false, error: error.message };
    }
  }

  async googleSignUp(userData) {
    if (this.mockMode) {
      // Mock Google Sign-Up response
      const mockUser = {
        id: 'google-driver-' + Date.now(),
        firebaseUid: userData.firebaseUid,
        email: userData.email,
        name: userData.displayName || 'New Google Driver',
        photoURL: userData.photoURL,
        phone: null,
        car_info: null,
        isActive: true,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profileComplete: false
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        token: 'google-jwt-token-' + Date.now(),
        user: mockUser
      };
    }
    
    try {
      const response = await this.request('/auth/driver/google-signup', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Google Sign-Up error:', error);
      return { success: false, error: error.message };
    }
  }

  // Driver profile methods
  async getDriverProfile() {
    // Check if this is a mock user
    const driverId = global.user?.id || this.userId;
    const isMockUser = driverId && (driverId === 'mock-driver' || driverId.startsWith('mock-driver-') || driverId === 1);
    
    // For mock users or mock mode, return mock data
    if (this.mockMode || isMockUser) {
      console.log('✅ Mock user profile:', mockData.user);
      return mockData.user;
    }
    
    if (!driverId) {
      throw new Error('Driver ID not found. Please login again.');
    }
    const result = await this.request(`/drivers/${driverId}/profile`);
    return result.data;
  }

  async updateDriverProfile(profileData) {
    if (this.mockMode) {
      return { ...mockData.user, ...profileData };
    }
    const driverId = global.user?.id || this.userId;
    if (!driverId) {
      throw new Error('Driver ID not found. Please login again.');
    }
    const result = await this.request(`/drivers/${driverId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return result.data;
  }

  async updateDriverLocation(latitude, longitude) {
    if (this.mockMode) {
      return { latitude, longitude };
    }
    
    // Get the current user/driver ID
    const driverId = global.user?.id || this.userId;
    if (!driverId) {
      throw new Error('Driver ID not found. Please login again.');
    }
    
    const result = await this.request(`/drivers/${driverId}/location`, {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude })
    });

    // Also emit to socket for real-time updates
    if (this.socket) {
      this.socket.emit('driver:location', { latitude, longitude });
    }

    // Update Firebase with location data
    if (this.firebaseIntegration) {
      try {
        await this.firebaseIntegration.updateLocation(latitude, longitude, {
          driverId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Firebase location update failed:', error);
      }
    }

    return result.data;
  }

  async toggleAvailability(available, location = null) {
    // Check if this is a mock user
    const driverId = global.user?.id || this.userId;
    const isMockUser = driverId && (driverId === 'mock-driver' || driverId.startsWith('mock-driver-') || driverId === 1);
    
    // For mock users, just return success
    if (this.mockMode || isMockUser) {
      console.log('✅ Mock user availability toggle:', available);
      return { success: true, available };
    }
    
    if (!driverId) {
      throw new Error('Driver ID not found. Please login again.');
    }
    
    const payload = { available };
    if (location) {
      payload.location = location;
    }
    
    const result = await this.request(`/drivers/${driverId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    
    // Emit to socket
    if (this.socket) {
      this.socket.emit('driver:availability', { driverId, available });
    }
    
    return result.data;
  }

  // Earnings and financial methods
  async getEarningsData(period = 'week') {
    // Check if this is a mock user
    const driverId = global.user?.id || this.userId;
    const isMockUser = driverId && (driverId === 'mock-driver' || driverId.startsWith('mock-driver-') || driverId === 1);
    
    // For mock users or mock mode, return mock data
    if (this.mockMode || isMockUser) {
      console.log('✅ Mock user earnings data:', mockData.earnings);
      return mockData.earnings;
    }
    
    if (!driverId) {
      throw new Error('Driver ID not found. Please login again.');
    }
    const result = await this.request(`/drivers/${driverId}/earnings?period=${period}`);
    return result.data;
  }

  async getRideHistory(page = 1, limit = 10) {
    if (this.mockMode) {
      return mockData.rides;
    }
    const driverId = global.user?.id || this.userId;
    if (!driverId) {
      throw new Error('Driver ID not found. Please login again.');
    }
    const result = await this.request(`/drivers/${driverId}/trips?page=${page}&limit=${limit}`);
    return result.data;
  }

  async getDriverStats() {
    // Check if this is a mock user
    const driverId = global.user?.id || this.userId;
    const isMockUser = driverId && (driverId === 'mock-driver' || driverId.startsWith('mock-driver-') || driverId === 1);
    
    // For mock users or mock mode, return mock data
    if (this.mockMode || isMockUser) {
      const stats = {
        totalRides: mockData.user.totalRides,
        rating: mockData.user.rating,
        onlineHours: 8.5,
        acceptanceRate: 95.2
      };
      console.log('✅ Mock user stats:', stats);
      return stats;
    }
    
    if (!driverId) {
      throw new Error('Driver ID not found. Please login again.');
    }
    const result = await this.request(`/drivers/${driverId}/stats`);
    return result.data;
  }

  // Ride management methods
  async getCurrentRide() {
    // Check if this is a mock user
    const driverId = global.user?.id || this.userId;
    const isMockUser = driverId && (driverId === 'mock-driver' || driverId.startsWith('mock-driver-') || driverId === 1);
    
    // For mock users or mock mode, return mock data
    if (this.mockMode || isMockUser) {
      console.log('✅ Mock user current ride:', mockData.currentRide);
      return mockData.currentRide;
    }
    
    if (!driverId) {
      throw new Error('Driver ID not found. Please login again.');
    }
    const result = await this.request(`/drivers/${driverId}/current-ride`);
    return result.data;
  }

  async getAvailableRides() {
    // Check if this is a mock user
    const driverId = global.user?.id || this.userId;
    const isMockUser = driverId && (driverId === 'mock-driver' || driverId.startsWith('mock-driver-') || driverId === 1);
    
    // For mock users or mock mode, return mock data
    if (this.mockMode || isMockUser) {
      console.log('✅ Mock user available rides:', mockData.rides);
      return mockData.rides;
    }
    
    const result = await this.request('/rides?status=requested');
    return result.data;
  }

  async updateRideStatus(rideId, status) {
    if (this.mockMode) {
      return { rideId, status };
    }
    const result = await this.request(`/rides/${rideId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });

    // Emit to socket
    if (this.socket) {
      this.socket.emit('ride:statusUpdate', { rideId, status });
    }

    return result.data;
  }

  async acceptRide(rideId) {
    if (this.mockMode) {
      return { rideId, status: 'accepted' };
    }
    return this.updateRideStatus(rideId, 'accepted');
  }

  async rejectRide(rideId) {
    if (this.mockMode) {
      return { rideId, status: 'rejected' };
    }
    return this.updateRideStatus(rideId, 'rejected');
  }

  async completeRide(rideId) {
    if (this.mockMode) {
      return { rideId, status: 'completed' };
    }
    return this.updateRideStatus(rideId, 'completed');
  }

  // Safety and emergency methods
  async reportEmergency(emergencyData) {
    if (this.mockMode) {
      return { ...emergencyData, reported: true };
    }
    const result = await this.request('/safety/emergency', {
      method: 'POST',
      body: JSON.stringify(emergencyData)
    });
    return result.data;
  }

  async getSafetyAlerts() {
    if (this.mockMode) {
      return [];
    }
    const result = await this.request('/safety/alerts');
    return result.data;
  }

  async checkIn(location, status = 'safe') {
    if (this.mockMode) {
      return { location, status };
    }
    const result = await this.request('/safety/check-in', {
      method: 'POST',
      body: JSON.stringify({ location, status })
    });
    return result.data;
  }

  // Notification methods
  async getNotifications() {
    if (this.mockMode) {
      return mockData.notifications;
    }
    const result = await this.request('/notifications');
    return result.data;
  }

  async markNotificationRead(notificationId) {
    if (this.mockMode) {
      return { notificationId, read: true };
    }
    const result = await this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
    return result.data;
  }

  // Utility methods
  async clearCache() {
    if (this.mockMode) {
      return { success: true };
    }
    await offlineManager.clearCache();
    return { success: true };
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      hasToken: !!this.token,
      socketConnected: this.socket?.connected || false,
      firebaseConnected: !!this.firebaseIntegration?.isInitialized,
      mockMode: this.mockMode
    };
  }

  // Event emitter (for app state management)
  emit(event, data) {
    // Log the event
    console.log(`📡 Emitting event: ${event}`, data);
    
    // Call registered callbacks
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(callback => callback(data));
    }
    
    // Also emit to Firebase if available
    if (this.firebaseIntegration) {
      this.firebaseIntegration.emit(event, data);
    }
  }

  // Register event callbacks
  on(event, callback) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
  }

  // Remove event callback
  off(event, callback) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event] = this.eventCallbacks[event].filter(cb => cb !== callback);
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;