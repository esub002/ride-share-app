import { auth } from '../firebase';

class FirebaseAuthService {
  constructor() {
    this.auth = auth;
  }

  // Sign in with phone number using React Native Firebase
  async signInWithPhone(phoneNumber) {
    try {
      console.log('📱 Starting phone authentication for:', phoneNumber);
      // Send OTP
      const confirmation = await this.auth().signInWithPhoneNumber(phoneNumber);
      // Save confirmation for OTP step
      this.confirmation = confirmation;
      return { success: true, confirmation };
    } catch (error) {
      console.error('❌ Phone sign-in error:', error);
      return { success: false, error: error.message || 'Failed to send verification code' };
    }
  }

  // Verify OTP using React Native Firebase
  async verifyOTP(confirmation, otp) {
    try {
      console.log('🔐 Verifying OTP...');
      // Confirm OTP
      const userCredential = await confirmation.confirm(otp);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      return { success: false, error: error.message || 'OTP verification failed' };
    }
  }

  // Sign out
  async signOut() {
    try {
      await this.auth().signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.auth().currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return this.auth().onAuthStateChanged(callback);
  }

  // Check if user is signed in
  isSignedIn() {
    return this.auth().currentUser !== null;
  }

  // Get user ID token
  async getIdToken() {
    try {
      const user = this.auth().currentUser;
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
      const user = this.auth().currentUser;
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
      const user = this.auth().currentUser;
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
      const user = this.auth().currentUser;
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
      const user = this.auth().currentUser;
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

const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService; 