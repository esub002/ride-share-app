// Firebase Configuration for Driver App
// This file handles Firebase setup with fallback to mock services for development

// Firebase project configuration - Replace with your actual credentials
const firebaseConfig = {
  // TODO: Replace with your actual Firebase project credentials
  apiKey: "YOUR_API_KEY_HERE", // Get from Firebase Console > Project Settings > General > Web API Key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace YOUR_PROJECT_ID with your actual project ID
  projectId: "YOUR_PROJECT_ID", // Replace with your actual project ID
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace YOUR_PROJECT_ID with your actual project ID
  messagingSenderId: "YOUR_SENDER_ID", // Get from Firebase Console > Project Settings > General > Cloud Messaging
  appId: "YOUR_APP_ID", // Get from Firebase Console > Project Settings > General > Your Apps
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: Get from Firebase Console > Project Settings > General > Analytics
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && 
         firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
         firebaseConfig.authDomain !== "YOUR_PROJECT_ID.firebaseapp.com";
};

// Firebase Service Manager Class
class FirebaseServiceManager {
  constructor() {
    this.isInitialized = false;
    this.auth = null;
    this.firestore = null;
    this.messaging = null;
    this.storage = null;
    this.analytics = null;
    this.config = firebaseConfig;
    this.useMockServices = !isFirebaseConfigured();
  }

  async initialize() {
    try {
      console.log('🔥 Initializing Firebase Services...');
      
      // Check if Firebase is properly configured
      if (this.useMockServices) {
        console.warn('⚠️ Firebase not configured. Using mock services for development.');
        console.log('💡 To use real Firebase, update firebaseConfig.js with your project credentials.');
        console.log('📖 Follow FIREBASE_SETUP_GUIDE.md for setup instructions.');
        
        // Initialize mock services
        await this.initializeMockServices();
        return true;
      }

      // Initialize React Native Firebase
      const { initializeApp } = require('@react-native-firebase/app');
      const { getAuth } = require('@react-native-firebase/auth');
      const { getFirestore } = require('@react-native-firebase/firestore');
      const { getMessaging } = require('@react-native-firebase/messaging');
      const { getStorage } = require('@react-native-firebase/storage');
      const { getAnalytics } = require('@react-native-firebase/analytics');

      // Initialize Firebase app
      const app = initializeApp(this.config);
      
      // Initialize services
      this.auth = getAuth(app);
      this.firestore = getFirestore(app);
      this.messaging = getMessaging(app);
      this.storage = getStorage(app);
      this.analytics = getAnalytics(app);

      this.isInitialized = true;
      console.log('✅ Firebase services initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      console.warn('⚠️ Falling back to mock services...');
      
      // Fallback to mock services
      await this.initializeMockServices();
      return true;
    }
  }

  async initializeMockServices() {
    try {
      console.log('🎭 Initializing Mock Firebase Services...');
      
      // Create mock auth service
      this.auth = {
        signInWithPhoneNumber: async (phoneNumber) => {
          console.log('📱 Mock: OTP sent to', phoneNumber);
          return {
            confirm: async (code) => {
              console.log('🔐 Mock: OTP verified', code);
              return {
                user: {
                  uid: 'mock-user-' + Date.now(),
                  phoneNumber: phoneNumber,
                  displayName: 'Mock Driver',
                  email: null,
                  getIdToken: async () => 'mock-token-' + Date.now(),
                  updateProfile: async (data) => Promise.resolve()
                }
              };
            }
          };
        },
        signOut: async () => {
          console.log('🚪 Mock: User signed out');
          return Promise.resolve();
        },
        currentUser: null,
        onAuthStateChanged: (callback) => {
          console.log('👤 Mock: Auth state listener registered');
          return () => {};
        }
      };

      // Create mock firestore
      this.firestore = {
        collection: (path) => ({
          doc: (id) => ({
            set: async (data) => {
              console.log('📝 Mock Firestore: Set document', path, id, data);
              return Promise.resolve();
            },
            get: async () => {
              console.log('📖 Mock Firestore: Get document', path, id);
              return Promise.resolve({ exists: true, data: () => ({}) });
            },
            update: async (data) => {
              console.log('✏️ Mock Firestore: Update document', path, id, data);
              return Promise.resolve();
            }
          }),
          add: async (data) => {
            console.log('➕ Mock Firestore: Add document', path, data);
            return Promise.resolve({ id: 'mock-doc-' + Date.now() });
          }
        })
      };

      // Create mock messaging
      this.messaging = {
        requestPermission: async () => {
          console.log('🔔 Mock: Notification permission requested');
          return 'granted';
        },
        getToken: async () => {
          console.log('📱 Mock: FCM token generated');
          return 'mock-fcm-token-' + Date.now();
        },
        onMessage: (callback) => {
          console.log('📨 Mock: Message listener registered');
          return () => {};
        }
      };

      // Create mock storage
      this.storage = {
        ref: (path) => ({
          putFile: async (file) => {
            console.log('📁 Mock Storage: Upload file', path);
            return Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('mock-url') } });
          },
          getDownloadURL: async () => {
            console.log('🔗 Mock Storage: Get download URL', path);
            return Promise.resolve('mock-download-url');
          }
        })
      };

      // Create mock analytics
      this.analytics = {
        logEvent: (eventName, parameters) => {
          console.log('📊 Mock Analytics: Log event', eventName, parameters);
        }
      };

      this.isInitialized = true;
      console.log('✅ Mock Firebase services initialized successfully');
    } catch (error) {
      console.error('❌ Mock services initialization failed:', error);
      return false;
    }
  }

  getAuth() {
    return this.auth;
  }

  getFirestore() {
    return this.firestore;
  }

  getMessaging() {
    return this.messaging;
  }

  getStorage() {
    return this.storage;
  }

  getAnalytics() {
    return this.analytics;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasAuth: !!this.auth,
      hasFirestore: !!this.firestore,
      hasMessaging: !!this.messaging,
      hasStorage: !!this.storage,
      hasAnalytics: !!this.analytics,
      useMockServices: this.useMockServices,
      config: {
        projectId: this.config.projectId,
        authDomain: this.config.authDomain
      }
    };
  }
}

// Create singleton instance
const firebaseServiceManager = new FirebaseServiceManager();

// Export for use in other files
export { firebaseServiceManager, firebaseConfig };
export default firebaseServiceManager;
