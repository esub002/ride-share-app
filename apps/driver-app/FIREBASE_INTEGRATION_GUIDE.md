# Firebase Integration Guide for Driver App

## 🎯 Overview

This guide covers the complete Firebase integration for the driver app, including authentication, real-time database, cloud messaging, storage, and analytics.

## 📋 Prerequisites

### 1. Firebase Project Setup
- ✅ Firebase project created: `ride-82`
- ✅ Web app configured with your Firebase config
- ✅ Required services enabled in Firebase Console

### 2. Required Dependencies
```bash
# Install Firebase dependencies
npm install firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage @react-native-firebase/messaging @react-native-firebase/analytics

# Install additional dependencies
npm install @react-native-async-storage/async-storage @react-native-community/netinfo react-native-permissions
```

### 3. Firebase Configuration
Your Firebase config is already set up in `firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAFYrgJcpIdKjNnMc1zJyOxWPAIjivZttg",
  authDomain: "ride-82.firebaseapp.com",
  projectId: "ride-82",
  storageBucket: "ride-82.firebasestorage.app",
  messagingSenderId: "799196884863",
  appId: "1:799196884863:web:1811c8ed525f77721db44a",
  measurementId: "G-YZSTT7TV3G"
};
```

## 🚀 Quick Start

### 1. Initialize Firebase Integration
```javascript
import firebaseIntegration from './utils/firebaseIntegration';

// Initialize Firebase integration
await firebaseIntegration.initialize();
```

### 2. Run Setup Verification
```javascript
import FirebaseSetup from './setup-firebase';

const setup = new FirebaseSetup();
await setup.runSetup();
```

## 🔧 Firebase Services Integration

### 1. Authentication Service
```javascript
import { firebaseServiceManager } from './firebase';
import auth from '@react-native-firebase/auth';

const auth = firebaseServiceManager.getAuth();

// To send OTP
const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

// To verify OTP
const userCredential = await confirmation.confirm(otpCode);
```

### 2. Firestore Database Service
```javascript
const firestore = firebaseServiceManager.getFirestore();

// Save driver profile
await firestore.saveDriverProfile(driverId, {
  name: 'John Driver',
  phone: '+1234567890',
  car: 'Toyota Prius 2020',
  rating: 4.8,
  totalRides: 1250,
  totalEarnings: 15420.50
});

// Get driver profile
const profile = await firestore.getDriverProfile(driverId);

// Save ride data
await firestore.saveRide(rideId, {
  driverId,
  passengerId,
  pickup: '123 Main St',
  destination: '456 Oak Ave',
  fare: 25.50,
  status: 'in_progress'
});

// Listen to real-time updates
firestore.onRideUpdate(rideId, (data) => {
  console.log('Ride updated:', data);
});
```

### 3. Cloud Messaging Service
```javascript
const messaging = firebaseServiceManager.getMessaging();

// Get FCM token
const tokenResult = await messaging.getFCMToken();
if (tokenResult.success) {
  console.log('FCM Token:', tokenResult.token);
}

// Listen to foreground messages
messaging.onForegroundMessage((payload) => {
  console.log('Message received:', payload);
  // Handle different message types
  switch (payload.data?.type) {
    case 'new_ride_request':
      // Handle new ride request
      break;
    case 'ride_status_update':
      // Handle ride status update
      break;
    case 'emergency_alert':
      // Handle emergency alert
      break;
  }
});
```

### 4. Storage Service
```javascript
const storage = firebaseServiceManager.getStorage();

// Upload driver document
const documentResult = await storage.uploadDriverDocument(
  driverId,
  file,
  'license'
);

// Upload profile picture
const pictureResult = await storage.uploadProfilePicture(
  driverId,
  file
);
```

### 5. Analytics Service
```javascript
const analytics = firebaseServiceManager.getAnalytics();

// Log custom events
analytics.logEvent('ride_started', {
  ride_id: rideId,
  fare: 25.50,
  distance: 5.2
});

// Log ride events
analytics.logRideEvent('ride_completed', {
  ride_id: rideId,
  duration: 15,
  rating: 5
});

// Log earnings events
analytics.logEarningsEvent('earnings_updated', {
  amount: 85.50,
  period: 'day'
});

// Log safety events
analytics.logSafetyEvent('emergency_reported', {
  location: '123 Main St',
  type: 'medical'
});
```

## 🔄 Firebase Integration Service

### 1. Enhanced Location Tracking
```javascript
// Update location with Firebase sync
await firebaseIntegration.updateLocation(latitude, longitude, {
  driverId,
  timestamp: new Date().toISOString(),
  accuracy: 10,
  speed: 25
});
```

### 2. Enhanced Ride Management
```javascript
// Save ride with Firebase sync
await firebaseIntegration.saveRide({
  id: rideId,
  driverId,
  passengerId,
  pickup: '123 Main St',
  destination: '456 Oak Ave',
  fare: 25.50,
  status: 'accepted',
  createdAt: new Date()
});
```

### 3. Enhanced Profile Management
```javascript
// Update profile with Firebase sync
await firebaseIntegration.updateProfile({
  name: 'John Driver',
  phone: '+1234567890',
  car: 'Toyota Prius 2020',
  rating: 4.8,
  totalRides: 1250,
  totalEarnings: 15420.50
});
```

### 4. Enhanced Earnings Tracking
```javascript
// Save earnings with Firebase sync
await firebaseIntegration.saveEarnings({
  today: 85.50,
  week: 420.75,
  month: 1850.25,
  total: 15420.50,
  rides: 8
});
```

## 📱 Real-Time Features

### 1. Real-Time Location Updates
```javascript
// Firebase automatically syncs location updates
firebaseIntegration.on('locationUpdate', (data) => {
  console.log('Location updated:', data);
  // Update UI with new location
});
```

### 2. Real-Time Ride Updates
```javascript
// Listen to ride status changes
firebaseIntegration.on('rideUpdate', (data) => {
  console.log('Ride updated:', data);
  // Update ride status in UI
});
```

### 3. Real-Time Notifications
```javascript
// Listen to FCM messages
firebaseIntegration.on('newRideRequest', (data) => {
  console.log('New ride request:', data);
  // Show ride request notification
});

firebaseIntegration.on('emergencyAlert', (data) => {
  console.log('Emergency alert:', data);
  // Show emergency notification
});
```

## 🔒 Security Rules

### 1. Firestore Security Rules
```javascript
// drivers collection
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Drivers can only access their own data
    match /drivers/{driverId} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Rides - drivers can read/write rides they're involved in
    match /rides/{rideId} {
      allow read, write: if request.auth != null && 
        (resource.data.driverId == request.auth.uid || 
         resource.data.passengerId == request.auth.uid);
    }
    
    // Driver locations - drivers can update their own location
    match /driver_locations/{driverId} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
  }
}
```

### 2. Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Drivers can upload their own documents
    match /drivers/{driverId}/documents/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Drivers can upload their own profile pictures
    match /drivers/{driverId}/profile.jpg {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
  }
}
```

## 📊 Analytics Events

### 1. User Journey Events
```javascript
// App opened
analytics.logEvent('app_opened', {
  user_type: 'driver',
  timestamp: new Date().toISOString()
});

// Login completed
analytics.logEvent('login_completed', {
  method: 'phone',
  timestamp: new Date().toISOString()
});

// Profile updated
analytics.logEvent('profile_updated', {
  fields_updated: ['name', 'car'],
  timestamp: new Date().toISOString()
});
```

### 2. Ride Events
```javascript
// Ride requested
analytics.logRideEvent('ride_requested', {
  pickup_location: '123 Main St',
  destination_location: '456 Oak Ave',
  estimated_fare: 25.50
});

// Ride accepted
analytics.logRideEvent('ride_accepted', {
  ride_id: rideId,
  response_time: 5.2
});

// Ride started
analytics.logRideEvent('ride_started', {
  ride_id: rideId,
  actual_pickup_time: new Date().toISOString()
});

// Ride completed
analytics.logRideEvent('ride_completed', {
  ride_id: rideId,
  duration: 15,
  distance: 5.2,
  fare: 25.50,
  rating: 5
});
```

### 3. Earnings Events
```javascript
// Earnings viewed
analytics.logEarningsEvent('earnings_viewed', {
  period: 'week',
  amount: 420.75
});

// Earnings milestone
analytics.logEarningsEvent('earnings_milestone', {
  milestone: 1000,
  amount: 15420.50
});
```

### 4. Safety Events
```javascript
// Safety check-in
analytics.logSafetyEvent('safety_checkin', {
  location: '123 Main St',
  status: 'safe',
  timestamp: new Date().toISOString()
});

// Emergency reported
analytics.logSafetyEvent('emergency_reported', {
  type: 'medical',
  location: '123 Main St',
  timestamp: new Date().toISOString()
});
```

## 🔧 Configuration

### 1. Environment Variables
```bash
# .env file
FIREBASE_API_KEY=AIzaSyAFYrgJcpIdKjNnMc1zJyOxWPAIjivZttg
FIREBASE_PROJECT_ID=ride-82
FIREBASE_MESSAGING_SENDER_ID=799196884863
FIREBASE_APP_ID=1:799196884863:web:1811c8ed525f77721db44a
FIREBASE_MEASUREMENT_ID=G-YZSTT7TV3G
```

### 2. App Configuration
```json
// app.json
{
  "expo": {
    "extra": {
      "USE_FIREBASE": "true",
      "FIREBASE_PROJECT_ID": "ride-82"
    }
  }
}
```

## 🧪 Testing

### 1. Firebase Setup Test
```javascript
import FirebaseSetup from './setup-firebase';

const setup = new FirebaseSetup();
const results = await setup.quickCheck();

console.log('Firebase Ready:', results.firebaseReady);
console.log('Integration Ready:', results.integrationReady);
console.log('API Ready:', results.apiReady);
console.log('All Ready:', results.allReady);
```

### 2. Service Tests
```javascript
// Test authentication
const auth = firebaseServiceManager.getAuth();
const user = auth.getCurrentUser();
console.log('Current user:', user);

// Test Firestore
const firestore = firebaseServiceManager.getFirestore();
const testData = await firestore.saveDriverProfile('test-driver', {
  name: 'Test Driver',
  phone: '+1234567890'
});
console.log('Test data saved:', testData);

// Test messaging
const messaging = firebaseServiceManager.getMessaging();
const token = await messaging.getFCMToken();
console.log('FCM token:', token);
```

## 🚨 Troubleshooting

### 1. Common Issues

#### Firebase Initialization Failed
```javascript
// Check Firebase config
console.log('Firebase config:', firebaseConfig);

// Check network connectivity
const NetInfo = require('@react-native-community/netinfo');
const state = await NetInfo.fetch();
console.log('Network state:', state);
```

#### Authentication Issues
```javascript
// Check if user is authenticated
const auth = firebaseServiceManager.getAuth();
const user = auth.getCurrentUser();
if (!user) {
  console.log('User not authenticated');
  // Redirect to login
}
```

#### Firestore Connection Issues
```javascript
// Check Firestore connection
const firestore = firebaseServiceManager.getFirestore();
try {
  await firestore.saveDriverProfile('test', { test: true });
  console.log('Firestore connection working');
} catch (error) {
  console.error('Firestore error:', error);
}
```

#### FCM Token Issues
```javascript
// Check FCM token
const messaging = firebaseServiceManager.getMessaging();
const tokenResult = await messaging.getFCMToken();
if (!tokenResult.success) {
  console.error('FCM token error:', tokenResult.error);
}
```

### 2. Debug Mode
```javascript
// Enable Firebase debug mode
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);

if (__DEV__) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## 📈 Performance Optimization

### 1. Offline Support
```javascript
// Enable offline persistence
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Disable network when offline
await disableNetwork(db);

// Re-enable when back online
await enableNetwork(db);
```

### 2. Data Caching
```javascript
// Cache frequently accessed data
const cachedProfile = await AsyncStorage.getItem('driver_profile');
if (cachedProfile) {
  return JSON.parse(cachedProfile);
}

// Fetch from Firebase and cache
const profile = await firestore.getDriverProfile(driverId);
await AsyncStorage.setItem('driver_profile', JSON.stringify(profile));
```

### 3. Batch Operations
```javascript
// Use batch operations for multiple updates
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);

batch.update(doc(db, 'drivers', driverId), { status: 'online' });
batch.update(doc(db, 'driver_locations', driverId), { 
  latitude, 
  longitude,
  timestamp: new Date() 
});

await batch.commit();
```

## 🔄 Migration from Mock Data

### 1. Gradual Migration
```javascript
// Check if Firebase is available
if (firebaseIntegration.isInitialized) {
  // Use Firebase
  await firebaseIntegration.saveRide(rideData);
} else {
  // Fallback to API
  await apiService.saveRide(rideData);
}
```

### 2. Data Sync
```javascript
// Sync existing data to Firebase
const existingRides = await apiService.getRideHistory();
for (const ride of existingRides) {
  await firebaseIntegration.saveRide(ride);
}
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)

## 🎉 Next Steps

1. **Test Firebase Integration**: Run the setup script to verify everything is working
2. **Configure Security Rules**: Set up proper Firestore and Storage security rules
3. **Set Up Analytics**: Configure Firebase Analytics for tracking user behavior
4. **Test Real-Time Features**: Verify real-time updates are working correctly
5. **Deploy to Production**: Update production configuration with Firebase settings

Your Firebase integration is now complete and ready to use! 🚀 