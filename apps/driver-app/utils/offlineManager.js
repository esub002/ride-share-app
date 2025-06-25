import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class OfflineManager {
  constructor() {
    this.isOnline = true;
    this.pendingActions = [];
    this.offlineData = {};
    this.listeners = [];
    this.init();
  }

  async init() {
    // Load pending actions from storage
    await this.loadPendingActions();
    
    // Listen for network changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      if (!wasOnline && this.isOnline) {
        this.handleOnline();
      } else if (wasOnline && !this.isOnline) {
        this.handleOffline();
      }
      
      this.notifyListeners();
    });
  }

  // Add network status listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        isOnline: this.isOnline,
        pendingActions: this.pendingActions.length
      });
    });
  }

  // Check if device is online
  isDeviceOnline() {
    return this.isOnline;
  }

  // Store data for offline use
  async storeOfflineData(key, data) {
    try {
      this.offlineData[key] = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(`offline_${key}`, JSON.stringify(this.offlineData[key]));
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  }

  // Get offline data
  async getOfflineData(key) {
    try {
      const stored = await AsyncStorage.getItem(`offline_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if data is not too old (24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  // Add action to pending queue
  async addPendingAction(action) {
    this.pendingActions.push({
      ...action,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    });
    await this.savePendingActions();
    this.notifyListeners();
  }

  // Save pending actions to storage
  async savePendingActions() {
    try {
      await AsyncStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  // Load pending actions from storage
  async loadPendingActions() {
    try {
      const stored = await AsyncStorage.getItem('pendingActions');
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }

  // Get pending actions count
  getPendingActionsCount() {
    return this.pendingActions.length;
  }

  // Get pending actions
  getPendingActions() {
    return this.pendingActions;
  }

  // Remove action from pending queue
  async removePendingAction(actionId) {
    this.pendingActions = this.pendingActions.filter(action => action.id !== actionId);
    await this.savePendingActions();
    this.notifyListeners();
  }

  // Handle coming back online
  async handleOnline() {
    console.log('Device is back online');
    
    // Process pending actions
    if (this.pendingActions.length > 0) {
      console.log(`Processing ${this.pendingActions.length} pending actions`);
      
      for (const action of [...this.pendingActions]) {
        try {
          await this.processPendingAction(action);
          await this.removePendingAction(action.id);
        } catch (error) {
          console.error('Error processing pending action:', error);
          // Keep action in queue if it failed
        }
      }
    }
  }

  // Handle going offline
  handleOffline() {
    console.log('Device went offline');
  }

  // Process a pending action
  async processPendingAction(action) {
    switch (action.type) {
      case 'UPDATE_LOCATION':
        return this.processLocationUpdate(action.data);
      case 'COMPLETE_RIDE':
        return this.processRideCompletion(action.data);
      case 'REPORT_INCIDENT':
        return this.processIncidentReport(action.data);
      case 'UPDATE_PROFILE':
        return this.processProfileUpdate(action.data);
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  // Process location update
  async processLocationUpdate(data) {
    // In a real app, this would send the location to the server
    console.log('Processing location update:', data);
    return Promise.resolve();
  }

  // Process ride completion
  async processRideCompletion(data) {
    // In a real app, this would send ride completion to the server
    console.log('Processing ride completion:', data);
    return Promise.resolve();
  }

  // Process incident report
  async processIncidentReport(data) {
    // In a real app, this would send incident report to the server
    console.log('Processing incident report:', data);
    return Promise.resolve();
  }

  // Process profile update
  async processProfileUpdate(data) {
    // In a real app, this would send profile update to the server
    console.log('Processing profile update:', data);
    return Promise.resolve();
  }

  // Cache API response
  async cacheApiResponse(endpoint, data, ttl = 5 * 60 * 1000) { // 5 minutes default
    const cacheKey = `api_cache_${endpoint}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching API response:', error);
    }
  }

  // Get cached API response
  async getCachedApiResponse(endpoint) {
    const cacheKey = `api_cache_${endpoint}`;
    
    try {
      const stored = await AsyncStorage.getItem(cacheKey);
      if (stored) {
        const cacheData = JSON.parse(stored);
        const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;
        
        if (!isExpired) {
          return cacheData.data;
        } else {
          // Remove expired cache
          await AsyncStorage.removeItem(cacheKey);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting cached API response:', error);
      return null;
    }
  }

  // Clear all cached data
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('api_cache_') || key.startsWith('offline_'));
      await AsyncStorage.multiRemove(cacheKeys);
      this.offlineData = {};
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get offline status summary
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      pendingActions: this.pendingActions.length,
      offlineDataKeys: Object.keys(this.offlineData)
    };
  }
}

export default new OfflineManager(); 