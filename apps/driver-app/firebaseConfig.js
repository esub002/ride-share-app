// React Native Firebase Configuration
import firebaseAuth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import storage from '@react-native-firebase/storage';
import analytics from '@react-native-firebase/analytics';

// Firebase configuration for React Native
const firebaseConfig = {
  apiKey: "AIzaSyAFYrgJcpIdKjNnMc1zJyOxWPAIjivZttg",
  authDomain: "ride-82.firebaseapp.com",
  projectId: "ride-82",
  storageBucket: "ride-82.appspot.com",
  messagingSenderId: "799196884863",
  appId: "1:799196884863:web:1811c8ed525f77721db44a",
  measurementId: "G-YZSTT7TV3G"
};

// Firebase Service Manager for React Native
class FirebaseServiceManager {
  constructor() {
    this.isInitialized = false;
    this.services = {
      auth: null,
      firestore: null,
      messaging: null,
      storage: null,
      analytics: null
    };
  }

  async initialize() {
    try {
      console.log('🔥 Initializing React Native Firebase Service Manager...');
      
      // Initialize Auth service
      this.services.auth = firebaseAuth();
      
      // Initialize other services
      this.services.firestore = firestore();
      this.services.messaging = messaging();
      this.services.storage = storage();
      this.services.analytics = analytics();
      
      this.isInitialized = true;
      console.log('✅ React Native Firebase Service Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ React Native Firebase Service Manager initialization failed:', error);
      return false;
    }
  }

  getAuth() {
    if (!this.isInitialized) {
      console.warn('⚠️ Firebase not initialized. Call initialize() first.');
      return null;
    }
    return this.services.auth;
  }

  getFirestore() {
    if (!this.isInitialized) {
      console.warn('⚠️ Firebase not initialized. Call initialize() first.');
      return null;
    }
    return this.services.firestore;
  }

  getMessaging() {
    if (!this.isInitialized) {
      console.warn('⚠️ Firebase not initialized. Call initialize() first.');
      return null;
    }
    return this.services.messaging;
  }

  getStorage() {
    if (!this.isInitialized) {
      console.warn('⚠️ Firebase not initialized. Call initialize() first.');
      return null;
    }
    return this.services.storage;
  }

  getAnalytics() {
    if (!this.isInitialized) {
      console.warn('⚠️ Firebase not initialized. Call initialize() first.');
      return null;
    }
    return this.services.analytics;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      services: Object.keys(this.services).map(key => ({
        name: key,
        available: this.services[key] !== null
      }))
    };
  }
}

// Create singleton instance
const firebaseServiceManager = new FirebaseServiceManager();

// Export the manager and config
export { firebaseServiceManager, firebaseConfig };
export default firebaseServiceManager;
