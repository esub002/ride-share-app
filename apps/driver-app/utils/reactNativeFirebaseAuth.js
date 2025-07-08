import auth from '@react-native-firebase/auth';
import { firebaseServiceManager } from '../firebaseConfig';

class ReactNativeFirebaseAuth {
  constructor() {
    this.auth = null;
    this.isInitialized = false;
  }

  // Initialize the service
  async initialize() {
    try {
      console.log('🔥 Initializing React Native Firebase Auth...');
      
      // Initialize the Firebase Service Manager
      await firebaseServiceManager.initialize();
      
      // Get the auth instance
      this.auth = firebaseServiceManager.getAuth();
      
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

  // Sign in with phone number
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

  // Verify OTP
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

  // Sign out
  async signOut() {
    try {
      if (this.auth) {
        await this.auth.signOut();
        console.log('✅ User signed out successfully');
        return { success: true };
      }
      return { success: false, error: 'Auth not initialized' };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    if (this.auth) {
      return this.auth.currentUser;
    }
    return null;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    if (this.auth) {
      return this.auth.onAuthStateChanged(callback);
    }
    return null;
  }

  // Check if user is signed in
  isSignedIn() {
    return this.auth ? !!this.auth.currentUser : false;
  }

  // Get user ID token
  async getIdToken() {
    try {
      if (this.auth && this.auth.currentUser) {
        return await this.auth.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      if (this.auth && this.auth.currentUser) {
        await this.auth.currentUser.updateProfile(profileData);
        return { success: true };
      }
      return { success: false, error: 'No current user' };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Get auth status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      auth: this.auth ? 'available' : 'not_available',
      currentUser: this.getCurrentUser() ? 'signed_in' : 'not_signed_in'
    };
  }

  // Cleanup resources
  cleanup() {
    this.auth = null;
    this.isInitialized = false;
  }
}

// Create and export a singleton instance
const reactNativeFirebaseAuth = new ReactNativeFirebaseAuth();
export default reactNativeFirebaseAuth; 