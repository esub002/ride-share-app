import { firebaseServiceManager } from '../firebaseConfig';

class GoogleSignInService {
  constructor() {
    this.isInitialized = false;
    this.googleSignIn = null;
    this.firebaseAuth = null;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Google Sign-In service...');
      
      // Check if Google Sign-In is available
      let GoogleSignin;
      try {
        GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
      } catch (error) {
        console.warn('⚠️ Google Sign-In not available, using mock service');
        await this.initializeMockGoogleSignIn();
        return true;
      }

      // Initialize Google Sign-In
      GoogleSignin.configure({
        webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your actual web client ID
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });

      this.googleSignIn = GoogleSignin;
      this.firebaseAuth = firebaseServiceManager.getAuth();
      
      this.isInitialized = true;
      console.log('✅ Google Sign-In service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Google Sign-In initialization failed:', error);
      console.warn('⚠️ Falling back to mock Google Sign-In...');
      
      await this.initializeMockGoogleSignIn();
      return true;
    }
  }

  async initializeMockGoogleSignIn() {
    try {
      console.log('🎭 Initializing Mock Google Sign-In service...');
      
      this.googleSignIn = {
        isSignedIn: async () => {
          console.log('🔍 Mock: Checking if user is signed in');
          return false;
        },
        signIn: async () => {
          console.log('🔐 Mock: Google Sign-In initiated');
          return {
            user: {
              id: 'mock-google-user-' + Date.now(),
              name: 'Mock Google User',
              email: 'mock@google.com',
              photo: 'https://via.placeholder.com/150',
              familyName: 'Mock',
              givenName: 'Google'
            },
            serverAuthCode: 'mock-auth-code-' + Date.now()
          };
        },
        signOut: async () => {
          console.log('🚪 Mock: Google Sign-Out');
          return Promise.resolve();
        },
        getCurrentUser: async () => {
          console.log('👤 Mock: Getting current Google user');
          return null;
        },
        revokeAccess: async () => {
          console.log('🚫 Mock: Revoking Google access');
          return Promise.resolve();
        }
      };

      this.firebaseAuth = firebaseServiceManager.getAuth();
      this.isInitialized = true;
      console.log('✅ Mock Google Sign-In service initialized successfully');
    } catch (error) {
      console.error('❌ Mock Google Sign-In initialization failed:', error);
      return false;
    }
  }

  async signIn() {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Sign-In service not initialized');
      }

      console.log('🔐 Starting Google Sign-In...');
      
      // Check if user is already signed in
      const isSignedIn = await this.googleSignIn.isSignedIn();
      if (isSignedIn) {
        console.log('👤 User already signed in with Google');
        const currentUser = await this.googleSignIn.getCurrentUser();
        return { success: true, user: currentUser };
      }

      // Sign in with Google
      const userInfo = await this.googleSignIn.signIn();
      console.log('✅ Google Sign-In successful:', userInfo.user.email);

      // Create Firebase credential
      const { GoogleAuthProvider, signInWithCredential } = require('@react-native-firebase/auth');
      const googleCredential = GoogleAuthProvider.credential(userInfo.serverAuthCode);
      
      // Sign in to Firebase with Google credential
      const firebaseUserCredential = await signInWithCredential(this.firebaseAuth, googleCredential);
      
      console.log('✅ Firebase authentication successful');
      
      return {
        success: true,
        user: {
          ...userInfo.user,
          firebaseUid: firebaseUserCredential.user.uid,
          getIdToken: async () => {
            try {
              return await firebaseUserCredential.user.getIdToken();
            } catch (error) {
              console.error('Error getting ID token:', error);
              return null;
            }
          }
        }
      };
    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      
      // Handle specific error cases
      if (error.code === 'SIGN_IN_CANCELLED') {
        return { success: false, error: 'Sign-in was cancelled by user' };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return { success: false, error: 'Google Play Services not available' };
      } else if (error.code === 'IN_DEVELOPMENT') {
        return { success: false, error: 'Google Sign-In not configured for development' };
      } else {
        return { success: false, error: error.message || 'Google Sign-In failed' };
      }
    }
  }

  async checkUserExists(email) {
    try {
      console.log('🔍 Checking if user exists:', email);
      
      // For mock service, simulate user check
      if (!this.firebaseAuth) {
        console.log('🎭 Mock: Checking user existence');
        const mockUsers = ['test@example.com', 'driver@example.com'];
        const exists = mockUsers.includes(email);
        return { success: true, exists };
      }

      // Real implementation would check against your backend
      // For now, return mock response
      return { success: true, exists: false };
    } catch (error) {
      console.error('❌ Error checking user existence:', error);
      return { success: false, error: error.message };
    }
  }

  async completeSignIn(firebaseUser, googleUser) {
    try {
      console.log('✅ Completing Google Sign-In...');
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Create user data for backend
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: googleUser.email,
        displayName: googleUser.name,
        photoURL: googleUser.photo,
        phoneNumber: null,
        carInfo: null
      };

      console.log('✅ Google Sign-In completed successfully');
      return {
        success: true,
        user: userData,
        token: idToken
      };
    } catch (error) {
      console.error('❌ Error completing Google Sign-In:', error);
      return { success: false, error: error.message };
    }
  }

  async handleNewUserSignUp(firebaseUser, googleUser) {
    try {
      console.log('👤 Handling new user sign-up...');
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Create new user data
      const newUserData = {
        firebaseUid: firebaseUser.uid,
        email: googleUser.email,
        displayName: googleUser.name,
        photoURL: googleUser.photo,
        phoneNumber: null,
        carInfo: null,
        isActive: true,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profileComplete: false
      };

      console.log('✅ New user sign-up completed');
      return {
        success: true,
        user: newUserData,
        token: idToken,
        isNewUser: true
      };
    } catch (error) {
      console.error('❌ Error handling new user sign-up:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      console.log('🚪 Signing out from Google...');
      
      if (this.googleSignIn) {
        await this.googleSignIn.signOut();
      }
      
      if (this.firebaseAuth) {
        await this.firebaseAuth.signOut();
      }
      
      console.log('✅ Google Sign-Out completed');
      return { success: true };
    } catch (error) {
      console.error('❌ Google Sign-Out failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    try {
      if (!this.googleSignIn) {
        return null;
      }
      
      const isSignedIn = await this.googleSignIn.isSignedIn();
      if (isSignedIn) {
        return await this.googleSignIn.getCurrentUser();
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  async revokeAccess() {
    try {
      console.log('🚫 Revoking Google access...');
      
      if (this.googleSignIn) {
        await this.googleSignIn.revokeAccess();
      }
      
      console.log('✅ Google access revoked');
      return { success: true };
    } catch (error) {
      console.error('❌ Error revoking Google access:', error);
      return { success: false, error: error.message };
    }
  }

  async checkPermissions() {
    try {
      console.log('🔐 Checking Google Sign-In permissions...');
      
      // For mock service, return granted permissions
      if (!this.googleSignIn) {
        console.log('🎭 Mock: Permissions check');
        return {
          success: true,
          permissions: {
            email: true,
            profile: true,
            openid: true
          }
        };
      }

      // Real implementation would check actual permissions
      return {
        success: true,
        permissions: {
          email: true,
          profile: true,
          openid: true
        }
      };
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserInfo() {
    try {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        return {
          success: true,
          user: currentUser
        };
      } else {
        return { success: false, error: 'No user signed in' };
      }
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export a singleton instance
const googleSignInService = new GoogleSignInService();
export default googleSignInService; 