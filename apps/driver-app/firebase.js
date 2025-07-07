// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, enableNetwork, disableNetwork } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getPerformance } from "firebase/performance";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFYrgJcpIdKjNnMc1zJyOxWPAIjivZttg",
  authDomain: "ride-82.firebaseapp.com",
  projectId: "ride-82",
  storageBucket: "ride-82.firebasestorage.app",
  messagingSenderId: "799196884863",
  appId: "1:799196884863:web:1811c8ed525f77721db44a",
  measurementId: "G-YZSTT7TV3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
let analytics = null;
let auth = null;
let db = null;
let storage = null;
let messaging = null;
let functions = null;
let performance = null;

// Initialize services with platform-specific handling
const initializeFirebaseServices = async () => {
  try {
    console.log('🔥 Initializing Firebase services...');

    // Initialize Analytics (web only)
    if (Platform.OS === 'web') {
      const analyticsSupported = await isSupported();
      if (analyticsSupported) {
        analytics = getAnalytics(app);
        console.log('✅ Firebase Analytics initialized');
      }
    }

    // Initialize Authentication
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('✅ Firebase Auth initialized');

    // Initialize Firestore
    db = getFirestore(app);
    console.log('✅ Firebase Firestore initialized');

    // Initialize Storage
    storage = getStorage(app);
    console.log('✅ Firebase Storage initialized');

    // Initialize Cloud Functions
    functions = getFunctions(app);
    console.log('✅ Firebase Functions initialized');

    // Initialize Performance Monitoring
    if (Platform.OS === 'web') {
      performance = getPerformance(app);
      console.log('✅ Firebase Performance initialized');
    }

    // Initialize Cloud Messaging (FCM)
    if (Platform.OS !== 'web') {
      try {
        messaging = getMessaging(app);
        console.log('✅ Firebase Cloud Messaging initialized');
      } catch (error) {
        console.warn('⚠️ FCM not available:', error.message);
      }
    }

    console.log('🎉 All Firebase services initialized successfully');
    return true;

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
};

// Firebase Authentication Service
class FirebaseAuthService {
  constructor() {
    this.auth = auth;
  }

  // Sign in with phone number using React Native Firebase
  async signInWithPhone(phoneNumber) {
    try {
      console.log('📱 Starting phone authentication for:', phoneNumber);
      
      // Use React Native Firebase for phone auth
      const { PhoneAuthProvider } = require('@react-native-firebase/auth');
      
      // Create phone auth provider
      const phoneProvider = new PhoneAuthProvider(auth());
      
      // Request verification code
      const verificationId = await phoneProvider.verifyPhoneNumber(phoneNumber);
      
      console.log('✅ Verification code sent successfully');
      return { success: true, verificationId };
    } catch (error) {
      console.error('❌ Phone sign-in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-phone-number') {
        return { success: false, error: 'Invalid phone number format' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many requests. Please try again later.' };
      } else if (error.code === 'auth/quota-exceeded') {
        return { success: false, error: 'SMS quota exceeded. Please try again later.' };
      } else {
        return { success: false, error: error.message || 'Failed to send verification code' };
      }
    }
  }

  // Verify OTP using React Native Firebase
  async verifyOTP(verificationId, otp) {
    try {
      console.log('🔐 Verifying OTP...');
      
      // Use React Native Firebase for OTP verification
      const { PhoneAuthProvider } = require('@react-native-firebase/auth');
      
      // Create credential
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      
      // Sign in with credential
      const result = await auth().signInWithCredential(credential);
      
      console.log('✅ OTP verification successful:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-verification-code') {
        return { success: false, error: 'Invalid verification code' };
      } else if (error.code === 'auth/invalid-verification-id') {
        return { success: false, error: 'Invalid verification session' };
      } else if (error.code === 'auth/session-expired') {
        return { success: false, error: 'Verification session expired. Please request a new code.' };
      } else {
        return { success: false, error: error.message || 'OTP verification failed' };
      }
    }
  }

  // Sign out
  async signOut() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged(callback);
  }
}

// Firebase Firestore Service
class FirebaseFirestoreService {
  constructor() {
    this.db = db;
  }

  // Save driver profile
  async saveDriverProfile(driverId, profileData) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(this.db, 'drivers', driverId), {
        ...profileData,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error('Save profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get driver profile
  async getDriverProfile(driverId) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(this.db, 'drivers', driverId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'Profile not found' };
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // Save ride data
  async saveRide(rideId, rideData) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(this.db, 'rides', rideId), {
        ...rideData,
        createdAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error('Save ride error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update ride status
  async updateRideStatus(rideId, status, additionalData = {}) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(this.db, 'rides', rideId), {
        status,
        ...additionalData,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error('Update ride error:', error);
      return { success: false, error: error.message };
    }
  }

  // Listen to real-time ride updates
  onRideUpdate(rideId, callback) {
    const { doc, onSnapshot } = require('firebase/firestore');
    return onSnapshot(doc(this.db, 'rides', rideId), (doc) => {
      if (doc.exists()) {
        callback({ success: true, data: doc.data() });
      } else {
        callback({ success: false, error: 'Ride not found' });
      }
    });
  }

  // Save location updates
  async saveLocationUpdate(driverId, locationData) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(this.db, 'driver_locations', driverId), {
        ...locationData,
        timestamp: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error('Save location error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get driver earnings
  async getDriverEarnings(driverId, period = 'week') {
    try {
      const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (period === 'week' ? 7 : period === 'month' ? 30 : 1));
      
      const q = query(
        collection(this.db, 'rides'),
        where('driverId', '==', driverId),
        where('status', '==', 'completed'),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const earnings = [];
      querySnapshot.forEach((doc) => {
        earnings.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: earnings };
    } catch (error) {
      console.error('Get earnings error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Firebase Cloud Messaging Service
class FirebaseMessagingService {
  constructor() {
    this.messaging = messaging;
  }

  // Get FCM token
  async getFCMToken() {
    if (!this.messaging) {
      return { success: false, error: 'FCM not available' };
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // Add your VAPID key here
      });
      
      if (token) {
        console.log('FCM Token:', token);
        return { success: true, token };
      } else {
        return { success: false, error: 'No registration token available' };
      }
    } catch (error) {
      console.error('Get FCM token error:', error);
      return { success: false, error: error.message };
    }
  }

  // Listen to foreground messages
  onForegroundMessage(callback) {
    if (!this.messaging) {
      return null;
    }

    return onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  }

  // Request notification permissions
  async requestNotificationPermission() {
    if (!this.messaging) {
      return { success: false, error: 'FCM not available' };
    }

    try {
      const permission = await Notification.requestPermission();
      return { 
        success: permission === 'granted', 
        permission 
      };
    } catch (error) {
      console.error('Request permission error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Firebase Storage Service
class FirebaseStorageService {
  constructor() {
    this.storage = storage;
  }

  // Upload driver document
  async uploadDriverDocument(driverId, file, documentType) {
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const storageRef = ref(this.storage, `drivers/${driverId}/documents/${documentType}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload document error:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload profile picture
  async uploadProfilePicture(driverId, file) {
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const storageRef = ref(this.storage, `drivers/${driverId}/profile.jpg`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload profile picture error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Firebase Analytics Service
class FirebaseAnalyticsService {
  constructor() {
    this.analytics = analytics;
  }

  // Log event
  logEvent(eventName, parameters = {}) {
    if (!this.analytics) {
      console.warn('Analytics not available');
      return;
    }

    try {
      const { logEvent } = require('firebase/analytics');
      logEvent(this.analytics, eventName, parameters);
    } catch (error) {
      console.error('Log event error:', error);
    }
  }

  // Log ride events
  logRideEvent(eventType, rideData = {}) {
    this.logEvent('ride_event', {
      event_type: eventType,
      ...rideData
    });
  }

  // Log earnings events
  logEarningsEvent(eventType, earningsData = {}) {
    this.logEvent('earnings_event', {
      event_type: eventType,
      ...earningsData
    });
  }

  // Log safety events
  logSafetyEvent(eventType, safetyData = {}) {
    this.logEvent('safety_event', {
      event_type: eventType,
      ...safetyData
    });
  }
}

// Main Firebase Service Manager
class FirebaseServiceManager {
  constructor() {
    this.auth = null;
    this.firestore = null;
    this.messaging = null;
    this.storage = null;
    this.analytics = null;
    this.isInitialized = false;
  }

  // Initialize all services
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    const success = await initializeFirebaseServices();
    if (success) {
      this.auth = new FirebaseAuthService();
      this.firestore = new FirebaseFirestoreService();
      this.messaging = new FirebaseMessagingService();
      this.storage = new FirebaseStorageService();
      this.analytics = new FirebaseAnalyticsService();
      this.isInitialized = true;
    }

    return success;
  }

  // Get service instances
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

  // Network control
  async enableNetwork() {
    if (db) {
      await enableNetwork(db);
    }
  }

  async disableNetwork() {
    if (db) {
      await disableNetwork(db);
    }
  }
}

// Create and export the main Firebase service manager
const firebaseServiceManager = new FirebaseServiceManager();

// Export individual services for direct access
export {
  app,
  analytics,
  auth,
  db,
  storage,
  messaging,
  functions,
  performance,
  FirebaseAuthService,
  FirebaseFirestoreService,
  FirebaseMessagingService,
  FirebaseStorageService,
  FirebaseAnalyticsService,
  FirebaseServiceManager,
  firebaseServiceManager as default
};