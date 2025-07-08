# Firebase OTP Authentication Fix Guide

## 🚨 Current Issues Identified

1. **Wrong Firebase SDK**: Using Firebase Web SDK instead of React Native Firebase
2. **Missing Configuration**: No proper Android/iOS Firebase configuration files
3. **Incorrect Auth Service**: Using web-based auth service instead of React Native Firebase Auth
4. **Missing Dependencies**: Some React Native Firebase dependencies may be missing

## 🔧 Step-by-Step Fix

### Step 1: Update Firebase Configuration

**File: `apps/driver-app/firebase.js`**
```javascript
// React Native Firebase Configuration
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import storage from '@react-native-firebase/storage';
import analytics from '@react-native-firebase/analytics';

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
      this.services.auth = auth();
      
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
    return this.services.auth;
  }

  // ... other getter methods
}

const firebaseServiceManager = new FirebaseServiceManager();
export const auth = firebaseServiceManager.getAuth();
export { firebaseServiceManager };
export default firebaseServiceManager;
```

### Step 2: Create React Native Firebase Auth Service

**File: `apps/driver-app/utils/reactNativeFirebaseAuth.js`**
```javascript
import auth from '@react-native-firebase/auth';
import { firebaseAuth } from '../firebaseConfig';

class ReactNativeFirebaseAuth {
  constructor() {
    this.auth = firebaseAuth;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔥 Initializing React Native Firebase Auth...');
      
      if (!this.auth) {
        throw new Error('Firebase Auth not available');
      }

      this.isInitialized = true;
      console.log('✅ React Native Firebase Auth initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ React Native Firebase Auth initialization failed:', error);
      return false;
    }
  }

  async signInWithPhone(phoneNumber) {
    try {
      console.log('📱 Starting phone authentication for:', phoneNumber);
      
      if (!this.auth) {
        throw new Error('Firebase Auth not initialized');
      }

      // Validate phone number format
      if (!this.validatePhoneNumber(phoneNumber)) {
        return { 
          success: false, 
          error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' 
        };
      }

      // Send OTP using React Native Firebase
      const confirmation = await this.auth.signInWithPhoneNumber(phoneNumber);
      console.log('✅ OTP sent successfully');
      
      return { success: true, confirmation };
    } catch (error) {
      console.error('❌ Phone sign-in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-phone-number') {
        return { 
          success: false, 
          error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' 
        };
      } else if (error.code === 'auth/too-many-requests') {
        return { 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        };
      } else if (error.code === 'auth/quota-exceeded') {
        return { 
          success: false, 
          error: 'SMS quota exceeded. Please try again later.' 
        };
      } else {
        return { 
          success: false, 
          error: error.message || 'Failed to send verification code' 
        };
      }
    }
  }

  async verifyOTP(confirmation, otp) {
    try {
      console.log('🔐 Verifying OTP...');
      
      if (!confirmation) {
        throw new Error('No confirmation object available');
      }

      if (!otp || otp.length !== 6) {
        return { 
          success: false, 
          error: 'Please enter a valid 6-digit OTP' 
        };
      }

      // Confirm OTP
      const userCredential = await confirmation.confirm(otp);
      
      // Extract user data
      const user = {
        uid: userCredential.user.uid,
        phoneNumber: userCredential.user.phoneNumber,
        displayName: userCredential.user.displayName || 'Driver',
        email: userCredential.user.email,
        getIdToken: async () => {
          try {
            return await userCredential.user.getIdToken();
          } catch (error) {
            console.error('Error getting ID token:', error);
            return null;
          }
        },
        updateProfile: async (data) => {
          try {
            await userCredential.user.updateProfile(data);
            return Promise.resolve();
          } catch (error) {
            console.error('Error updating profile:', error);
            return Promise.reject(error);
          }
        }
      };
      
      console.log('✅ OTP verified successfully');
      return { success: true, user };
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-verification-code') {
        return { 
          success: false, 
          error: 'Invalid OTP code. Please check and try again.' 
        };
      } else if (error.code === 'auth/invalid-verification-id') {
        return { 
          success: false, 
          error: 'Invalid verification session. Please request a new OTP.' 
        };
      } else if (error.code === 'auth/session-expired') {
        return { 
          success: false, 
          error: 'OTP session expired. Please request a new OTP.' 
        };
      } else {
        return { 
          success: false, 
          error: error.message || 'OTP verification failed' 
        };
      }
    }
  }

  validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  // ... other methods
}

const reactNativeFirebaseAuth = new ReactNativeFirebaseAuth();
export default reactNativeFirebaseAuth;
```

### Step 3: Update Android Configuration

**File: `apps/driver-app/android/build.gradle`**
```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
        kotlinVersion = "1.8.0"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
        // Add Google Services plugin for Firebase
        classpath("com.google.gms:google-services:4.3.15")
    }
}
```

**File: `apps/driver-app/android/app/build.gradle`**
```gradle
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"
apply plugin: "com.google.gms.google-services"  // Google Services plugin

// ... rest of the configuration
```

### Step 4: Create Google Services Configuration

**File: `apps/driver-app/android/app/google-services.json`**
```json
{
  "project_info": {
    "project_number": "799196884863",
    "project_id": "ride-82",
    "storage_bucket": "ride-82.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:799196884863:android:1811c8ed525f77721db44a",
        "android_client_info": {
          "package_name": "com.driverapp"
        }
      },
      "oauth_client": [
        {
          "client_id": "799196884863-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyAFYrgJcpIdKjNnMc1zJyOxWPAIjivZttg"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": "799196884863-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
              "client_type": 3
            }
          ]
        }
      }
    }
  ],
  "configuration_version": "1"
}
```

### Step 5: Update LoginScreen

**File: `apps/driver-app/LoginScreen.js`**
```javascript
// Update imports
import reactNativeFirebaseAuth from './utils/reactNativeFirebaseAuth';

// Update handleSendOTP function
const handleSendOTP = useCallback(async () => {
  setError("");
  if (!formattedPhone || formattedPhone.length < 10) {
    setError('Please enter a valid phone number');
    return;
  }
  setLoading(true);
  try {
    console.log('📱 Sending OTP to:', formattedPhone);
    
    // Initialize React Native Firebase Auth if not already done
    if (!reactNativeFirebaseAuth.isInitialized) {
      await reactNativeFirebaseAuth.initialize();
    }
    
    // Use React Native Firebase Auth for phone auth
    const result = await reactNativeFirebaseAuth.signInWithPhone(formattedPhone);
    
    if (result.success && result.confirmation) {
      console.log('✅ OTP sent successfully');
      setConfirmation(result.confirmation);
      setStep('otp-screen'); // Navigate to OTP screen
    } else {
      console.error('❌ OTP sending failed:', result.error);
      setError(result.error || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('❌ OTP sending error:', error);
    setError(error.message || 'Failed to send OTP');
  } finally {
    setLoading(false);
  }
}, [formattedPhone]);

// Update handleVerifyOTP function
const handleVerifyOTP = useCallback(async () => {
  setError("");
  if (!isOTPValid()) return;
  setLoading(true);
  try {
    if (!confirmation) {
      setError('No confirmation object. Please request OTP again.');
      setStep('phone');
      return;
    }
    const result = await reactNativeFirebaseAuth.verifyOTP(confirmation, otp);
    if (result.success && result.user) {
      global.user = result.user;
      onLogin(result.user.uid, result.user);
    } else {
      setError(result.error || 'Invalid OTP or login failed');
    }
  } catch (error) {
    setError(error.message || 'Login failed');
  } finally {
    setLoading(false);
  }
}, [confirmation, otp, onLogin]);
```

### Step 6: Update OTPLogin Component

**File: `apps/driver-app/OTPLogin.js`**
```javascript
// Update imports
import reactNativeFirebaseAuth from './utils/reactNativeFirebaseAuth';

// Update verifyOTP calls
const result = await reactNativeFirebaseAuth.verifyOTP(confirmation, otp);
```

## 🧪 Testing the Fix

### Run the Test Script
```javascript
import FirebaseOTPTester from './test-firebase-otp';

const tester = new FirebaseOTPTester();
await tester.runAllTests();
```

### Run the Setup Script
```javascript
import FirebaseOTPSetup from './setup-firebase-otp';

const setup = new FirebaseOTPSetup();
await setup.runSetup();
```

## 🔍 Troubleshooting Common Issues

### Issue 1: "Firebase Auth not available"
**Solution:**
- Check if `@react-native-firebase/auth` is installed
- Verify `google-services.json` is in `android/app/`
- Clean and rebuild the project

### Issue 2: "Invalid phone number format"
**Solution:**
- Ensure phone number is in international format (+1234567890)
- Check phone number validation logic

### Issue 3: "Too many requests"
**Solution:**
- Wait before trying again
- Check Firebase project quota settings
- Verify phone authentication is enabled in Firebase Console

### Issue 4: "Network error"
**Solution:**
- Check internet connection
- Verify Firebase project settings
- Check if Firebase project is in the correct region

### Issue 5: "App not authorized"
**Solution:**
- Add SHA-1 fingerprint to Firebase project
- Enable phone authentication in Firebase Console
- Verify package name matches Firebase configuration

## 📱 Firebase Console Setup

1. **Enable Phone Authentication:**
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Phone Number provider

2. **Add SHA-1 Fingerprint:**
   - Go to Project Settings > General
   - Add your app's SHA-1 fingerprint

3. **Configure reCAPTCHA:**
   - Go to Authentication > Settings
   - Configure reCAPTCHA settings for your app

## 🚀 Production Checklist

- [ ] Firebase project configured correctly
- [ ] Phone authentication enabled
- [ ] SHA-1 fingerprint added
- [ ] `google-services.json` in place
- [ ] All dependencies installed
- [ ] React Native Firebase Auth service working
- [ ] OTP sending and verification tested
- [ ] Error handling implemented
- [ ] User registration flow working

## 📞 Support

If you're still experiencing issues:

1. Check the Firebase Console for any error messages
2. Verify your Firebase project configuration
3. Test with a real phone number (not emulator)
4. Check the device logs for detailed error messages
5. Ensure you're using the latest version of React Native Firebase

The fix should resolve the OTP generation issues and enable proper Firebase phone authentication in your driver app. 