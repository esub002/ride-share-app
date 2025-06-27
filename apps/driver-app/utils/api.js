import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineManager from './offlineManager';
import performanceOptimizer from './performanceOptimizer';

// Updated to use your local backend
export const API_BASE_URL = "http://10.1.10.243:3000"; // Change to your computer's IP if needed

// Mock data for when backend is not available
export const MOCK_DATA = {
  earnings: {
    today: 125.50,
    week: 847.25,
    month: 3240.75,
    total: 15420.50,
  },
  paymentMethods: [
    {
      id: 1,
      type: 'bank',
      accountName: 'Chase Bank',
      accountNumber: '****1234',
      isDefault: true,
    },
    {
      id: 2,
      type: 'card',
      accountName: 'Visa Card',
      accountNumber: '****5678',
      isDefault: false,
    },
  ],
  transactions: [
    {
      id: 1,
      type: 'ride_earnings',
      amount: 25.50,
      description: 'Ride from Downtown to Uptown',
      date: '2024-01-15T10:30:00Z',
      status: 'completed',
    },
    {
      id: 2,
      type: 'tip',
      amount: 5.00,
      description: 'Tip from John D.',
      date: '2024-01-15T10:30:00Z',
      status: 'completed',
    },
    {
      id: 3,
      type: 'withdrawal',
      amount: -500.00,
      description: 'Withdrawal to Chase Bank',
      date: '2024-01-14T15:20:00Z',
      status: 'completed',
    },
  ],
  emergencyContacts: [
    {
      id: 1,
      name: 'Sarah Johnson',
      phone: '+1-555-0123',
      relationship: 'Spouse',
      isDefault: true,
    },
    {
      id: 2,
      name: 'Mike Wilson',
      phone: '+1-555-0456',
      relationship: 'Friend',
      isDefault: false,
    },
  ],
};

// Mock data for offline fallback
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
  }

  // Initialize API service
  async init() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
      this.isOnline = offlineManager.isDeviceOnline();
      
      // Listen for network changes
      offlineManager.addListener(({ isOnline }) => {
        this.isOnline = isOnline;
      });

      // Initialize Socket.IO if token exists
      if (this.token) {
        this.initializeSocket();
      }
    } catch (error) {
      console.error('API initialization error:', error);
    }
  }

  // Initialize Socket.IO connection for real-time updates
  initializeSocket() {
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
    AsyncStorage.setItem('authToken', token);
    
    // Initialize socket connection with new token
    if (token) {
      this.initializeSocket();
    } else {
      this.disconnectSocket();
    }
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    AsyncStorage.removeItem('authToken');
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
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    };

    // If offline, return cached data or mock data
    if (!this.isOnline) {
      console.log('Device offline, using cached/mock data for:', endpoint);
      
      // Try to get cached data first
      const cachedData = await offlineManager.getCachedApiResponse(endpoint);
      if (cachedData) {
        return { success: true, data: cachedData, cached: true };
      }
      
      // Return mock data as fallback
      const mockData = this.getMockData(endpoint);
      return { success: true, data: mockData, mock: true };
    }

    // Retry logic for failed requests
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🌐 API Request (attempt ${attempt}): ${config.method} ${url}`);
        
        const response = await fetch(url, config);
        const data = await response.json();
        
        console.log(`✅ API Response: ${response.status}`, data);
        
        if (response.ok) {
          // Cache successful responses
          await offlineManager.cacheApiResponse(endpoint, data);
          return { success: true, data };
        } else {
          // Handle specific error cases
          if (response.status === 401) {
            // Token expired or invalid
            this.clearToken();
            throw new Error('Authentication failed. Please login again.');
          }
          
          throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ API Request failed (attempt ${attempt}):`, error);
        
        if (attempt === this.retryAttempts) {
          // Last attempt failed, return mock data
          const mockData = this.getMockData(endpoint);
          return { success: false, data: mockData, error: error.message, mock: true };
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Get mock data for specific endpoints
  getMockData(endpoint) {
    if (endpoint.includes('/earnings')) return mockData.earnings;
    if (endpoint.includes('/rides')) return mockData.rides;
    if (endpoint.includes('/profile')) return mockData.user;
    if (endpoint.includes('/notifications')) return mockData.notifications;
    return mockData;
  }

  // Authentication methods
  async loginDriver(phone, otp, name = null, carInfo = null) {
    const body = { phone, otp };
    if (name && carInfo) {
      body.name = name;
      body.car_info = carInfo;
    }

    const result = await this.request('/auth/driver/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (result.success && result.data.token) {
      this.setToken(result.data.token);
      return result.data;
    }
    
    throw new Error(result.error || 'Login failed');
  }

  async sendOTP(phone) {
    const result = await this.request('/auth/driver/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });

    if (result.success) {
      return result.data;
    }
    
    throw new Error(result.error || 'Failed to send OTP');
  }

  // Driver profile methods
  async getDriverProfile() {
    const result = await this.request('/drivers/profile');
    return result.data;
  }

  async updateDriverProfile(profileData) {
    const result = await this.request('/drivers/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return result.data;
  }

  async updateDriverLocation(latitude, longitude) {
    const result = await this.request('/drivers/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude })
    });

    // Also emit to socket for real-time updates
    if (this.socket) {
      this.socket.emit('driver:location', { latitude, longitude });
    }

    return result.data;
  }

  async toggleAvailability(available) {
    const result = await this.request('/drivers/availability', {
      method: 'PATCH',
      body: JSON.stringify({ available })
    });
    return result.data;
  }

  // Earnings and financial methods
  async getEarningsData(period = 'week') {
    const result = await this.request(`/drivers/earnings?period=${period}`);
    return result.data;
  }

  async getRideHistory(page = 1, limit = 10) {
    const result = await this.request(`/drivers/trips?page=${page}&limit=${limit}`);
    return result.data;
  }

  async getDriverStats() {
    const result = await this.request('/drivers/stats');
    return result.data;
  }

  // Ride management methods
  async getCurrentRide() {
    const result = await this.request('/drivers/current-ride');
    return result.data;
  }

  async getAvailableRides() {
    const result = await this.request('/rides?status=requested');
    return result.data;
  }

  async acceptRide(rideId) {
    const result = await this.request(`/rides/${rideId}/accept`, {
      method: 'POST'
    });

    // Emit to socket
    if (this.socket) {
      this.socket.emit('ride:accept', { rideId });
    }

    return result.data;
  }

  async rejectRide(rideId, reason = '') {
    const result = await this.request(`/rides/${rideId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return result.data;
  }

  async updateRideStatus(rideId, status) {
    const result = await this.request(`/rides/${rideId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    // Emit to socket
    if (this.socket) {
      this.socket.emit('ride:statusUpdate', { rideId, status });
    }

    return result.data;
  }

  async completeRide(rideId) {
    const result = await this.request(`/rides/${rideId}/complete`, {
      method: 'POST'
    });
    return result.data;
  }

  // Safety and emergency methods
  async reportEmergency(emergencyData) {
    const result = await this.request('/safety/emergency', {
      method: 'POST',
      body: JSON.stringify(emergencyData)
    });
    return result.data;
  }

  async getSafetyAlerts() {
    const result = await this.request('/safety/alerts');
    return result.data;
  }

  async checkIn(location, status = 'safe') {
    const result = await this.request('/safety/check-in', {
      method: 'POST',
      body: JSON.stringify({ location, status })
    });
    return result.data;
  }

  // Notification methods
  async getNotifications() {
    const result = await this.request('/notifications');
    return result.data;
  }

  async markNotificationRead(notificationId) {
    const result = await this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
    return result.data;
  }

  // Utility methods
  async clearCache() {
    await offlineManager.clearCache();
    return { success: true };
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      hasToken: !!this.token,
      socketConnected: this.socket?.connected || false
    };
  }

  // Socket event emitter (for app state management)
  emit(event, data) {
    // This can be connected to your app's event system
    console.log(`📡 Emitting event: ${event}`, data);
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService; 