/**
 * Firebase Integration Service
 * 
 * This service integrates Firebase services with the existing API service
 * to provide offline capabilities, real-time sync, and enhanced features.
 */

import firebaseServiceManager from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class FirebaseIntegrationService {
  constructor() {
    this.isInitialized = false;
    this.auth = null;
    this.firestore = null;
    this.messaging = null;
    this.storage = null;
    this.analytics = null;
    this.syncQueue = [];
    this.isOnline = true;
    this.syncInterval = null;
  }

  /**
   * Initialize Firebase integration
   */
  async initialize() {
    try {
      console.log('🔥 Initializing Firebase Integration...');
      
      // Initialize Firebase services using the service manager
      const success = await firebaseServiceManager.initialize();
      if (!success) {
        console.log('⚠️ Firebase service manager initialization failed, continuing with mock services');
      }

      // Get service instances
      this.auth = firebaseServiceManager.getAuth();
      this.firestore = firebaseServiceManager.getFirestore();
      this.messaging = firebaseServiceManager.getMessaging();
      this.storage = firebaseServiceManager.getStorage();
      this.analytics = firebaseServiceManager.getAnalytics();

      // Check service status
      const status = firebaseServiceManager.getStatus();
      console.log('📊 Firebase Service Status:', status);

      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Setup FCM token management
      await this.setupFCMToken();
      
      // Start sync queue processing
      this.startSyncQueue();
      
      this.isInitialized = true;
      console.log('✅ Firebase Integration initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Firebase Integration initialization failed:', error);
      // Continue with mock services even if initialization fails
      this.auth = firebaseServiceManager.getAuth();
      this.firestore = firebaseServiceManager.getFirestore();
      this.messaging = firebaseServiceManager.getMessaging();
      this.storage = firebaseServiceManager.getStorage();
      this.analytics = firebaseServiceManager.getAnalytics();
      
      this.isInitialized = true;
      console.log('⚠️ Firebase Integration initialized with mock services');
      return true;
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    // Monitor network connectivity
    const NetInfo = require('@react-native-community/netinfo');
    
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      if (!wasOnline && this.isOnline) {
        console.log('🌐 Network restored - processing sync queue');
        this.processSyncQueue();
      } else if (wasOnline && !this.isOnline) {
        console.log('📡 Network lost - switching to offline mode');
      }
    });
  }

  /**
   * Setup FCM token management
   */
  async setupFCMToken() {
    try {
      // Request notification permissions
      const permissionResult = await this.messaging.requestNotificationPermission();
      if (permissionResult.success) {
        // Get FCM token
        const tokenResult = await this.messaging.getFCMToken();
        if (tokenResult.success) {
          await AsyncStorage.setItem('fcm_token', tokenResult.token);
          console.log('📱 FCM token saved:', tokenResult.token);
          
          // Send token to backend
          this.sendFCMTokenToBackend(tokenResult.token);
        }
      }
    } catch (error) {
      console.error('FCM setup error:', error);
    }
  }

  /**
   * Send FCM token to backend
   */
  async sendFCMTokenToBackend(token) {
    try {
      const currentUser = this.auth.getCurrentUser();
      if (currentUser) {
        await this.firestore.saveDriverProfile(currentUser.uid, {
          fcmToken: token,
          platform: Platform.OS,
          lastTokenUpdate: new Date()
        });
      }
    } catch (error) {
      console.error('Send FCM token error:', error);
    }
  }

  /**
   * Start sync queue processing
   */
  startSyncQueue() {
    // Process sync queue every 30 seconds
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  /**
   * Add item to sync queue
   */
  addToSyncQueue(action, data) {
    const queueItem = {
      id: Date.now() + Math.random(),
      action,
      data,
      timestamp: new Date(),
      retryCount: 0
    };
    
    this.syncQueue.push(queueItem);
    console.log(`📝 Added to sync queue: ${action}`);
    
    // Process immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    console.log(`🔄 Processing ${this.syncQueue.length} items in sync queue`);
    
    const itemsToProcess = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const item of itemsToProcess) {
      try {
        await this.processQueueItem(item);
      } catch (error) {
        console.error(`❌ Failed to process queue item ${item.action}:`, error);
        
        // Retry logic
        if (item.retryCount < 3) {
          item.retryCount++;
          this.syncQueue.push(item);
        } else {
          console.error(`❌ Max retries reached for ${item.action}`);
        }
      }
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(item) {
    switch (item.action) {
      case 'UPDATE_LOCATION':
        await this.syncLocationUpdate(item.data);
        break;
      case 'SAVE_RIDE':
        await this.syncRideData(item.data);
        break;
      case 'UPDATE_PROFILE':
        await this.syncProfileUpdate(item.data);
        break;
      case 'SAVE_EARNINGS':
        await this.syncEarningsData(item.data);
        break;
      default:
        console.warn(`Unknown sync action: ${item.action}`);
    }
  }

  /**
   * Sync location update
   */
  async syncLocationUpdate(locationData) {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      await this.firestore.saveLocationUpdate(currentUser.uid, locationData);
      this.analytics.logEvent('location_update', locationData);
    }
  }

  /**
   * Sync ride data
   */
  async syncRideData(rideData) {
    await this.firestore.saveRide(rideData.id, rideData);
    this.analytics.logRideEvent('ride_saved', rideData);
  }

  /**
   * Sync profile update
   */
  async syncProfileUpdate(profileData) {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      await this.firestore.saveDriverProfile(currentUser.uid, profileData);
      this.analytics.logEvent('profile_updated', profileData);
    }
  }

  /**
   * Sync earnings data
   */
  async syncEarningsData(earningsData) {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      await this.firestore.saveDriverProfile(currentUser.uid, {
        earnings: earningsData,
        lastEarningsUpdate: new Date()
      });
      this.analytics.logEarningsEvent('earnings_saved', earningsData);
    }
  }

  /**
   * Enhanced location tracking with Firebase
   */
  async updateLocation(latitude, longitude, additionalData = {}) {
    const locationData = {
      latitude,
      longitude,
      timestamp: new Date(),
      ...additionalData
    };

    // Save to local storage for offline access
    await AsyncStorage.setItem('last_location', JSON.stringify(locationData));
    
    // Add to sync queue
    this.addToSyncQueue('UPDATE_LOCATION', locationData);
    
    // Log analytics
    this.analytics.logEvent('location_updated', {
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Enhanced ride management with Firebase
   */
  async saveRide(rideData) {
    // Add to sync queue
    this.addToSyncQueue('SAVE_RIDE', rideData);
    
    // Log analytics
    this.analytics.logRideEvent('ride_created', rideData);
  }

  /**
   * Enhanced profile management with Firebase
   */
  async updateProfile(profileData) {
    // Add to sync queue
    this.addToSyncQueue('UPDATE_PROFILE', profileData);
    
    // Log analytics
    this.analytics.logEvent('profile_updated', profileData);
  }

  /**
   * Enhanced earnings tracking with Firebase
   */
  async saveEarnings(earningsData) {
    // Add to sync queue
    this.addToSyncQueue('SAVE_EARNINGS', earningsData);
    
    // Log analytics
    this.analytics.logEarningsEvent('earnings_updated', earningsData);
  }

  /**
   * Get offline data
   */
  async getOfflineData(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Get offline data error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Save offline data
   */
  async saveOfflineData(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Save offline data error for ${key}:`, error);
    }
  }

  /**
   * Setup real-time listeners
   */
  setupRealtimeListeners() {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) return;

    // Listen to ride updates
    this.firestore.onRideUpdate('current_ride', (data) => {
      if (data.success) {
        console.log('🔄 Real-time ride update received:', data.data);
        // Emit to app state management
        this.emit('rideUpdate', data.data);
      }
    });

    // Listen to FCM messages
    this.messaging.onForegroundMessage((payload) => {
      console.log('📱 FCM message received:', payload);
      this.handleFCMessage(payload);
    });
  }

  /**
   * Handle FCM messages
   */
  handleFCMessage(payload) {
    const { data, notification } = payload;
    
    // Handle different message types
    switch (data?.type) {
      case 'new_ride_request':
        this.emit('newRideRequest', data);
        break;
      case 'ride_status_update':
        this.emit('rideStatusUpdate', data);
        break;
      case 'emergency_alert':
        this.emit('emergencyAlert', data);
        break;
      case 'earnings_update':
        this.emit('earningsUpdate', data);
        break;
      default:
        console.log('Unknown FCM message type:', data?.type);
    }

    // Log analytics
    this.analytics.logEvent('fcm_message_received', {
      message_type: data?.type,
      notification_title: notification?.title
    });
  }

  /**
   * Upload driver documents
   */
  async uploadDocument(file, documentType) {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const result = await this.storage.uploadDriverDocument(
      currentUser.uid,
      file,
      documentType
    );

    if (result.success) {
      // Update profile with document URL
      await this.updateProfile({
        [`${documentType}Url`]: result.url,
        [`${documentType}UploadedAt`]: new Date()
      });
    }

    return result;
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file) {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const result = await this.storage.uploadProfilePicture(
      currentUser.uid,
      file
    );

    if (result.success) {
      // Update profile with picture URL
      await this.updateProfile({
        profilePictureUrl: result.url,
        profilePictureUpdatedAt: new Date()
      });
    }

    return result;
  }

  /**
   * Get driver earnings with Firebase
   */
  async getEarnings(period = 'week') {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await this.firestore.getDriverEarnings(currentUser.uid, period);
      
      if (result.success) {
        // Log analytics
        this.analytics.logEarningsEvent('earnings_viewed', {
          period,
          count: result.data.length
        });
      }
      
      return result;
    } catch (error) {
      console.error('Get earnings error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.syncQueue = [];
    this.isInitialized = false;
  }

  /**
   * Event emitter for real-time updates
   */
  emit(event, data) {
    // This would integrate with your app's event system
    // For now, we'll use a simple callback system
    if (this.eventCallbacks && this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(callback => callback(data));
    }
  }

  /**
   * Register event callbacks
   */
  on(event, callback) {
    if (!this.eventCallbacks) {
      this.eventCallbacks = {};
    }
    
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    
    this.eventCallbacks[event].push(callback);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isOnline: this.isOnline,
      syncQueueLength: this.syncQueue.length,
      hasAuth: !!this.auth,
      hasFirestore: !!this.firestore,
      hasMessaging: !!this.messaging,
      hasStorage: !!this.storage,
      hasAnalytics: !!this.analytics
    };
  }
}

// Create and export the Firebase integration service
const firebaseIntegration = new FirebaseIntegrationService();

export default firebaseIntegration; 