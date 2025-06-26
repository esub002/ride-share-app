import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineManager from './offlineManager';
import performanceOptimizer from './performanceOptimizer';

export const API_BASE_URL = "http://10.1.10.243:3000"; // Updated to your computer's local IP address

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
    this.baseURL = 'http://172.21.240.1:3000/api';
    this.token = null;
    this.isOnline = true;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
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
    } catch (error) {
      console.error('API initialization error:', error);
    }
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    AsyncStorage.setItem('authToken', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    AsyncStorage.removeItem('authToken');
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
      const mockResponse = this.getMockData(endpoint);
      if (mockResponse) {
        return { success: true, data: mockResponse, mock: true };
      }
      
      return { success: false, error: 'No data available offline' };
    }

    // Use performance optimizer for API calls
    return performanceOptimizer.optimizedApiCall(
      endpoint,
      async () => {
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
          try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache successful responses
            await offlineManager.cacheApiResponse(endpoint, data);
            
            return { success: true, data };
          } catch (error) {
            console.error(`API request failed (attempt ${attempt}):`, error);
            
            if (attempt === this.retryAttempts) {
              // On final attempt, try to get cached data
              const cachedData = await offlineManager.getCachedApiResponse(endpoint);
              if (cachedData) {
                return { success: true, data: cachedData, cached: true };
              }
              
              // Return mock data as last resort
              const mockResponse = this.getMockData(endpoint);
              if (mockResponse) {
                return { success: true, data: mockResponse, mock: true };
              }
              
              throw error;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
          }
        }
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  // Get mock data for specific endpoints
  getMockData(endpoint) {
    const endpointMap = {
      '/driver/profile': mockData.user,
      '/driver/earnings': mockData.earnings,
      '/driver/rides': mockData.rides,
      '/driver/current-ride': mockData.currentRide,
      '/driver/notifications': mockData.notifications,
      '/driver/stats': {
        totalRides: mockData.user.totalRides,
        totalEarnings: mockData.user.totalEarnings,
        rating: mockData.user.rating,
        onlineHours: 8.5,
        acceptanceRate: 95.2
      }
    };

    return endpointMap[endpoint] || null;
  }

  // API Methods with proper error handling

  // Get driver profile
  async getDriverProfile() {
    try {
      const response = await this.request('/driver/profile');
      return response;
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      return { success: false, error: 'Failed to load profile', data: mockData.user };
    }
  }

  // Update driver profile
  async updateDriverProfile(profileData) {
    try {
      const response = await this.request('/driver/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      // Add to pending actions if offline
      if (!this.isOnline) {
        await offlineManager.addPendingAction({
          type: 'UPDATE_PROFILE',
          data: profileData
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error updating driver profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  // Get earnings data
  async getEarningsData(period = 'week') {
    try {
      const response = await this.request(`/driver/earnings?period=${period}`);
      return response;
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      return { success: false, error: 'Failed to load earnings', data: mockData.earnings };
    }
  }

  // Get ride history
  async getRideHistory(page = 1, limit = 10) {
    try {
      const response = await this.request(`/driver/rides?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching ride history:', error);
      return { success: false, error: 'Failed to load ride history', data: mockData.rides };
    }
  }

  // Get current ride
  async getCurrentRide() {
    try {
      const response = await this.request('/driver/current-ride');
      return response;
    } catch (error) {
      console.error('Error fetching current ride:', error);
      return { success: false, error: 'Failed to load current ride', data: mockData.currentRide };
    }
  }

  // Accept ride request
  async acceptRide(rideId) {
    try {
      const response = await this.request(`/driver/rides/${rideId}/accept`, {
        method: 'POST'
      });
      
      // Add to pending actions if offline
      if (!this.isOnline) {
        await offlineManager.addPendingAction({
          type: 'ACCEPT_RIDE',
          data: { rideId }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error accepting ride:', error);
      return { success: false, error: 'Failed to accept ride' };
    }
  }

  // Reject ride request
  async rejectRide(rideId, reason = '') {
    try {
      const response = await this.request(`/driver/rides/${rideId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      
      // Add to pending actions if offline
      if (!this.isOnline) {
        await offlineManager.addPendingAction({
          type: 'REJECT_RIDE',
          data: { rideId, reason }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error rejecting ride:', error);
      return { success: false, error: 'Failed to reject ride' };
    }
  }

  // Complete ride
  async completeRide(rideId) {
    try {
      const response = await this.request(`/driver/rides/${rideId}/complete`, {
        method: 'POST'
      });
      
      // Add to pending actions if offline
      if (!this.isOnline) {
        await offlineManager.addPendingAction({
          type: 'COMPLETE_RIDE',
          data: { rideId }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error completing ride:', error);
      return { success: false, error: 'Failed to complete ride' };
    }
  }

  // Update driver location
  async updateLocation(latitude, longitude) {
    try {
      const response = await this.request('/driver/location', {
        method: 'PUT',
        body: JSON.stringify({ latitude, longitude })
      });
      
      // Add to pending actions if offline
      if (!this.isOnline) {
        await offlineManager.addPendingAction({
          type: 'UPDATE_LOCATION',
          data: { latitude, longitude, timestamp: Date.now() }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error updating location:', error);
      return { success: false, error: 'Failed to update location' };
    }
  }

  // Get notifications
  async getNotifications() {
    try {
      const response = await this.request('/driver/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: 'Failed to load notifications', data: mockData.notifications };
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      const response = await this.request(`/driver/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  // Report incident
  async reportIncident(incidentData) {
    try {
      const response = await this.request('/driver/incidents', {
        method: 'POST',
        body: JSON.stringify(incidentData)
      });
      
      // Add to pending actions if offline
      if (!this.isOnline) {
        await offlineManager.addPendingAction({
          type: 'REPORT_INCIDENT',
          data: incidentData
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error reporting incident:', error);
      return { success: false, error: 'Failed to report incident' };
    }
  }

  // Get driver statistics
  async getDriverStats() {
    try {
      const response = await this.request('/driver/stats');
      return response;
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      return { 
        success: false, 
        error: 'Failed to load statistics', 
        data: {
          totalRides: mockData.user.totalRides,
          totalEarnings: mockData.user.totalEarnings,
          rating: mockData.user.rating,
          onlineHours: 8.5,
          acceptanceRate: 95.2
        }
      };
    }
  }

  // Clear all cached data
  async clearCache() {
    try {
      await offlineManager.clearCache();
      performanceOptimizer.clearCaches();
      return { success: true };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return { success: false, error: 'Failed to clear cache' };
    }
  }

  // Get API status
  getStatus() {
    return {
      isOnline: this.isOnline,
      hasToken: !!this.token,
      pendingActions: offlineManager.getPendingActionsCount(),
      performanceMetrics: performanceOptimizer.getPerformanceMetrics()
    };
  }
}

export default new ApiService(); 