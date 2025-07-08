import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { firebaseServiceManager } from '../firebaseConfig';
import apiService from './api';

class GoogleSignInService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🔧 Initializing Google Sign-In service...');
      
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // TODO: Replace with your real client ID
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });

      // Check if user is already signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const userInfo = await GoogleSignin.getCurrentUser();
        this.currentUser = userInfo;
        console.log('✅ User already signed in with Google:', userInfo.user.email);
      }

      this.isInitialized = true;
      console.log('✅ Google Sign-In service initialized');
      return true;
    } catch (error) {
      console.error('❌ Google Sign-In initialization failed:', error);
      return false;
    }
  }

  async signIn() {
    try {
      console.log('🔄 Starting Google Sign-In process...');
      
      // Ensure service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if Play Services are available (Android only)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const { idToken, user } = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful:', user.email);

      // Create Firebase credential
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase with Google credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase authentication successful:', firebaseUser.email);

      // Check if user exists in our backend
      const userExists = await this.checkUserExists(firebaseUser.email);
      
      if (userExists) {
        // Existing user - complete sign-in
        console.log('👤 Existing user detected, completing sign-in...');
        const signInResult = await this.completeSignIn(firebaseUser, user);
        return signInResult;
      } else {
        // New user - redirect to sign-up
        console.log('🆕 New user detected, redirecting to sign-up...');
        const signUpResult = await this.handleNewUserSignUp(firebaseUser, user);
        return signUpResult;
      }

    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      
      // Handle specific error cases
      if (error.code === 'SIGN_IN_CANCELLED') {
        return {
          success: false,
          error: 'Sign-in was cancelled by the user',
          code: 'CANCELLED'
        };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          success: false,
          error: 'Google Play Services not available',
          code: 'PLAY_SERVICES_ERROR'
        };
      } else if (error.code === 'SIGN_IN_REQUIRED') {
        return {
          success: false,
          error: 'Sign-in required',
          code: 'SIGN_IN_REQUIRED'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Google Sign-In failed',
          code: 'UNKNOWN_ERROR'
        };
      }
    }
  }

  async checkUserExists(email) {
    try {
      console.log('🔍 Checking if user exists in backend:', email);
      
      // Call backend API to check if user exists
      const response = await apiService.checkUserExists(email);

      if (response.success) {
        console.log('✅ User check completed:', response.data);
        return response.data.exists;
      } else {
        console.warn('⚠️ User check failed, assuming new user:', response.error);
        return false; // Assume new user if check fails
      }
    } catch (error) {
      console.error('❌ Error checking user existence:', error);
      return false; // Assume new user on error
    }
  }

  async completeSignIn(firebaseUser, googleUser) {
    try {
      console.log('🔄 Completing sign-in for existing user...');
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Prepare user data for backend
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        idToken: idToken,
        googleUser: {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          photo: googleUser.photo,
          familyName: googleUser.familyName,
          givenName: googleUser.givenName
        }
      };
      
      // Call backend to complete sign-in
      const response = await apiService.googleSignIn(userData);

      if (response.success) {
        console.log('✅ Sign-in completed successfully');
        
        // Store user data
        this.currentUser = {
          ...googleUser,
          firebaseUid: firebaseUser.uid,
          backendData: response.user || response.data?.user
        };

        return {
          success: true,
          user: this.currentUser,
          token: response.token || response.data?.token,
          isNewUser: false,
          message: 'Welcome back!'
        };
      } else {
        console.error('❌ Backend sign-in failed:', response.error);
        return {
          success: false,
          error: response.error || 'Backend sign-in failed',
          code: 'BACKEND_ERROR'
        };
      }
    } catch (error) {
      console.error('❌ Error completing sign-in:', error);
      return {
        success: false,
        error: error.message || 'Sign-in completion failed',
        code: 'COMPLETION_ERROR'
      };
    }
  }

  async handleNewUserSignUp(firebaseUser, googleUser) {
    try {
      console.log('🆕 Handling new user sign-up...');
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Prepare user data for backend
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        idToken: idToken,
        googleUser: {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          photo: googleUser.photo,
          familyName: googleUser.familyName,
          givenName: googleUser.givenName
        },
        // Additional driver-specific fields
        driverProfile: {
          phone: firebaseUser.phoneNumber || null,
          isActive: true,
          registrationDate: new Date().toISOString(),
          profileComplete: false // Will be completed in profile setup
        }
      };
      
      // Call backend to create new user account
      const response = await apiService.googleSignUp(userData);

      if (response.success) {
        console.log('✅ New user sign-up completed successfully');
        
        // Store user data
        this.currentUser = {
          ...googleUser,
          firebaseUid: firebaseUser.uid,
          backendData: response.user || response.data?.user
        };

        return {
          success: true,
          user: this.currentUser,
          token: response.token || response.data?.token,
          isNewUser: true,
          message: 'Account created successfully! Please complete your profile.',
          requiresProfileSetup: true
        };
      } else {
        console.error('❌ Backend sign-up failed:', response.error);
        return {
          success: false,
          error: response.error || 'Backend sign-up failed',
          code: 'BACKEND_ERROR'
        };
      }
    } catch (error) {
      console.error('❌ Error handling new user sign-up:', error);
      return {
        success: false,
        error: error.message || 'Sign-up failed',
        code: 'SIGNUP_ERROR'
      };
    }
  }

  async signOut() {
    try {
      console.log('🔄 Signing out from Google...');
      
      // Sign out from Firebase
      await auth().signOut();
      
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Clear local data
      this.currentUser = null;
      apiService.clearToken();
      
      console.log('✅ Sign-out completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
      return {
        success: false,
        error: error.message || 'Sign-out failed'
      };
    }
  }

  async getCurrentUser() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const userInfo = await GoogleSignin.getCurrentUser();
        this.currentUser = userInfo;
        return userInfo;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  async revokeAccess() {
    try {
      console.log('🔄 Revoking Google access...');
      await GoogleSignin.revokeAccess();
      console.log('✅ Google access revoked');
      return { success: true };
    } catch (error) {
      console.error('❌ Error revoking access:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke access'
      };
    }
  }

  // Check if user has required permissions
  async checkPermissions() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        return {
          hasAccess: false,
          error: 'User not signed in'
        };
      }

      const userInfo = await GoogleSignin.getCurrentUser();
      if (!userInfo) {
        return {
          hasAccess: false,
          error: 'No user info available'
        };
      }

      return {
        hasAccess: true,
        user: userInfo
      };
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return {
        hasAccess: false,
        error: error.message
      };
    }
  }

  // Get user's Google account info
  async getUserInfo() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        return null;
      }

      const userInfo = await GoogleSignin.getCurrentUser();
      return userInfo;
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      return null;
    }
  }
}

// Create singleton instance
const googleSignInService = new GoogleSignInService();

export default googleSignInService; 