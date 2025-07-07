import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

class FirebaseAuthService {
  constructor() {
    this.auth = auth();
  }

  // Sign in with phone number using React Native Firebase
  async signInWithPhone(phoneNumber) {
    try {
      console.log('📱 Starting phone authentication for:', phoneNumber);
      
      // Request verification code
      const verificationId = await this.auth.verifyPhoneNumber(phoneNumber);
      
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
      } else if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error. Please check your connection.' };
      } else {
        return { success: false, error: error.message || 'Failed to send verification code' };
      }
    }
  }

  // Verify OTP using React Native Firebase
  async verifyOTP(verificationId, otp) {
    try {
      console.log('🔐 Verifying OTP...');
      
      // Create credential
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      
      // Sign in with credential
      const result = await this.auth.signInWithCredential(credential);
      
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
      } else if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error. Please check your connection.' };
      } else {
        return { success: false, error: error.message || 'OTP verification failed' };
      }
    }
  }

  // Sign out
  async signOut() {
    try {
      await this.auth.signOut();
      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
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

  // Check if user is signed in
  isSignedIn() {
    return this.auth.currentUser !== null;
  }

  // Get user ID token
  async getIdToken() {
    try {
      const user = this.auth.currentUser;
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
      const user = this.auth.currentUser;
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
      const user = this.auth.currentUser;
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
      const user = this.auth.currentUser;
      if (user) {
        await user.sendEmailVerification();
        console.log('✅ Email verification sent');
        return { success: true };
      } else {
        return { success: false, error: 'No user signed in' };
      }
    } catch (error) {
      console.error('❌ Error sending email verification:', error);
      return { success: false, error: error.message };
    }
  }

  // Reload user
  async reloadUser() {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await user.reload();
        console.log('✅ User reloaded successfully');
        return { success: true };
      } else {
        return { success: false, error: 'No user signed in' };
      }
    } catch (error) {
      console.error('❌ Error reloading user:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const firebaseAuthService = new FirebaseAuthService();

export default firebaseAuthService; 