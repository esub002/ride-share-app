import { API_BASE_URL } from '../config/api';

export interface DriverAuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    firebaseUid?: string;
    email: string;
    name: string;
    photoURL?: string;
    phone?: string;
    car_info?: string;
    isActive: boolean;
    registrationDate: string;
    lastLogin: string;
    profileComplete?: boolean;
  };
  error?: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string;
  error?: string;
}

class DriverAuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL || 'http://localhost:3000/api';
  }

  // Send OTP to driver's phone number
  async sendOTP(phone: string): Promise<OTPResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/driver/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Failed to send OTP',
          error: data.error,
        };
      }

      return {
        success: true,
        message: data.message || 'OTP sent successfully',
        otp: data.otp, // For testing purposes
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: 'Network error',
      };
    }
  }

  // Verify OTP and login/register driver
  async verifyOTP(
    phone: string,
    otp: string,
    name?: string,
    carInfo?: string
  ): Promise<DriverAuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/driver/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          otp,
          name,
          car_info: carInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to verify OTP',
        };
      }

      return {
        success: true,
        token: data.token,
        user: data.driver,
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Check if driver exists by phone number
  async checkDriverExists(phone: string): Promise<{ exists: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/driver/exists?phone=${phone}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          exists: false,
          error: data.error || 'Failed to check driver existence',
        };
      }

      return {
        exists: data.exists,
      };
    } catch (error) {
      console.error('Error checking driver existence:', error);
      return {
        exists: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Google Sign-In for existing users
  async googleSignIn(
    firebaseUid: string,
    email: string,
    idToken: string,
    displayName?: string,
    photoURL?: string
  ): Promise<DriverAuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/driver/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid,
          email,
          displayName,
          photoURL,
          idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to sign in with Google',
        };
      }

      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      console.error('Error in Google Sign-In:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Google Sign-Up for new users
  async googleSignUp(
    firebaseUid: string,
    email: string,
    idToken: string,
    displayName?: string,
    photoURL?: string,
    driverProfile?: any
  ): Promise<DriverAuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/driver/google-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid,
          email,
          displayName,
          photoURL,
          idToken,
          driverProfile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to sign up with Google',
        };
      }

      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      console.error('Error in Google Sign-Up:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Validate JWT token
  async validateToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          valid: false,
          error: data.error || 'Invalid token',
        };
      }

      return {
        valid: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Error validating token:', error);
      return {
        valid: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Refresh JWT token
  async refreshToken(refreshToken: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to refresh token',
        };
      }

      return {
        success: true,
        token: data.token,
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Logout driver
  async logout(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: data.error || 'Failed to logout',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error logging out:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }
}

export default new DriverAuthService(); 