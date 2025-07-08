import { firebaseServiceManager } from '../firebaseConfig';

class FirebaseAuthService {
  constructor() {
    this.firebaseServiceManager = firebaseServiceManager;
    this.auth = null;
  }

  // Initialize the service
  async initialize() {
    try {
      console.log('🔥 Initializing React Native Firebase Auth Service...');
      const success = await this.firebaseServiceManager.initialize();
      if (success) {
        this.auth = this.firebaseServiceManager.getAuth();
        console.log('✅ React Native Firebase Auth Service initialized successfully');
      } else {
        console.log('⚠️ React Native Firebase Auth Service initialization failed');
      }
      return success;
    } catch (error) {
      console.error('❌ React Native Firebase Auth Service initialization failed:', error);
      return false;
    }
  }

  // Sign in with phone number using React Native Firebase
  async signInWithPhone(phoneNumber) {
    try {
      console.log('📱 Starting React Native Firebase phone authentication for:', phoneNumber);
      
      if (!this.auth) {
        throw new Error('Firebase Auth not initialized');
      }

      // Use React Native Firebase phone authentication
      const confirmation = await this.auth.signInWithPhoneNumber(phoneNumber);
      console.log('✅ OTP sent successfully via React Native Firebase');
      
      return { success: true, confirmation };
    } catch (error) {
      console.error('❌ React Native Firebase phone sign-in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-phone-number') {
        return { success: false, error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many requests. Please try again later.' };
      } else if (error.code === 'auth/quota-exceeded') {
        return { success: false, error: 'SMS quota exceeded. Please try again later.' };
      } else if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error. Please check your internet connection.' };
      } else {
        return { success: false, error: error.message || 'Failed to send verification code' };
      }
    }
  }

  // Verify OTP using React Native Firebase
  async verifyOTP(confirmation, otp) {
    try {
      console.log('🔐 Verifying OTP with React Native Firebase...');
      
      if (!confirmation) {
        throw new Error('No confirmation object available');
      }

      // Confirm OTP using React Native Firebase
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
      console.error('❌ React Native Firebase OTP verification error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-verification-code') {
        return { success: false, error: 'Invalid OTP code. Please check and try again.' };
      } else if (error.code === 'auth/invalid-verification-id') {
        return { success: false, error: 'Invalid verification session. Please request a new OTP.' };
      } else if (error.code === 'auth/session-expired') {
        return { success: false, error: 'OTP session expired. Please request a new OTP.' };
      } else {
        return { success: false, error: error.message || 'OTP verification failed' };
      }
    }
  }

  // Sign out
  async signOut() {
    try {
      if (this.auth) {
        await this.auth.signOut();
        console.log('✅ Signed out successfully');
        return { success: true };
      } else {
        return { success: false, error: 'Auth not initialized' };
      }
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
    return () => {};
  }

  // Check if user is signed in
  isSignedIn() {
    const user = this.getCurrentUser();
    return user !== null;
  }

  // Get user ID token
  async getIdToken() {
    try {
      const user = this.getCurrentUser();
      if (user) {
        const token = await user.getIdToken();
        return { success: true, token };
      } else {
        return { success: false, error: 'No user signed in' };
      }
    } catch (error) {
      console.error('❌ Error getting ID token:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete user account
  async deleteAccount() {
    try {
      const user = this.getCurrentUser();
      if (user) {
        await user.delete();
        console.log('✅ Account deleted successfully');
        return { success: true };
      } else {
        return { success: false, error: 'No user signed in' };
      }
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const user = this.getCurrentUser();
      if (user) {
        await user.updateProfile(profileData);
        console.log('✅ Profile updated successfully');
        return { success: true };
      } else {
        return { success: false, error: 'No user signed in' };
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email verification
  async sendEmailVerification() {
    try {
      const user = this.getCurrentUser();
      if (user && user.email) {
        await user.sendEmailVerification();
        console.log('✅ Email verification sent successfully');
        return { success: true };
      } else {
        return { success: false, error: 'No user signed in or no email available' };
      }
    } catch (error) {
      console.error('❌ Error sending email verification:', error);
      return { success: false, error: error.message };
    }
  }

  // Reload user data
  async reloadUser() {
    try {
      const user = this.getCurrentUser();
      if (user) {
        await user.reload();
        console.log('✅ User data reloaded successfully');
        return { success: true };
      } else {
        return { success: false, error: 'No user signed in' };
      }
    } catch (error) {
      console.error('❌ Error reloading user:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    // Basic phone number validation for international format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Cleanup resources
  cleanup() {
    // React Native Firebase handles cleanup automatically
    console.log('🧹 Firebase Auth Service cleanup completed');
  }
}

// Create and export a singleton instance
const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService; 