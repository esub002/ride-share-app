// Mock Firebase Authentication Service
// This provides OTP functionality without requiring the actual Firebase SDK

class MockFirebaseAuth {
  constructor() {
    this.isInitialized = true;
    this.currentUser = null;
    this.testOTP = '123456'; // Test OTP for development
  }

  async initialize() {
    console.log('🔥 Mock Firebase Auth initialized');
    return true;
  }

  async signInWithPhone(phoneNumber) {
    try {
      console.log('📱 Mock: Sending OTP to:', phoneNumber);
      
      // Validate phone number format
      if (!this.validatePhoneNumber(phoneNumber)) {
        return { 
          success: false, 
          error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' 
        };
      }

      // Simulate OTP sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock confirmation object
      const confirmation = {
        confirm: async (otp) => {
          console.log('🔐 Mock: Verifying OTP:', otp);
          
          if (otp === this.testOTP) {
            // Create mock user
            const user = {
              uid: `mock-user-${Date.now()}`,
              phoneNumber: phoneNumber,
              displayName: 'Mock Driver',
              email: null,
              getIdToken: async () => 'mock-token-' + Date.now(),
              updateProfile: async (data) => {
                console.log('Mock: Updating profile:', data);
                return Promise.resolve();
              }
            };
            
            this.currentUser = user;
            return { user };
          } else {
            throw new Error('Invalid OTP code');
          }
        }
      };
      
      console.log('✅ Mock: OTP sent successfully');
      return { success: true, confirmation };
    } catch (error) {
      console.error('❌ Mock: Phone sign-in error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send OTP' 
      };
    }
  }

  async verifyOTP(confirmation, otp) {
    try {
      console.log('🔐 Mock: Verifying OTP...');
      
      if (!confirmation) {
        throw new Error('No confirmation object available');
      }

      if (!otp || otp.length !== 6) {
        return { 
          success: false, 
          error: 'Please enter a valid 6-digit OTP' 
        };
      }

      // Use the mock confirmation
      const userCredential = await confirmation.confirm(otp);
      
      // Extract user data
      const user = {
        uid: userCredential.user.uid,
        phoneNumber: userCredential.user.phoneNumber,
        displayName: userCredential.user.displayName || 'Mock Driver',
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
      
      console.log('✅ Mock: OTP verified successfully');
      return { success: true, user };
    } catch (error) {
      console.error('❌ Mock: OTP verification error:', error);
      
      if (error.message.includes('Invalid OTP')) {
        return { 
          success: false, 
          error: 'Invalid OTP code. Please check and try again.' 
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

  getCurrentUser() {
    return this.currentUser;
  }

  isSignedIn() {
    return !!this.currentUser;
  }

  async signOut() {
    this.currentUser = null;
    console.log('Mock: User signed out');
    return Promise.resolve();
  }

  onAuthStateChanged(callback) {
    // Mock auth state change listener
    console.log('Mock: Auth state change listener registered');
    return () => console.log('Mock: Auth state change listener removed');
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasAuth: true,
      currentUser: this.currentUser
    };
  }

  cleanup() {
    this.currentUser = null;
    console.log('Mock: Firebase Auth cleaned up');
  }
}

const mockFirebaseAuth = new MockFirebaseAuth();
export default mockFirebaseAuth; 