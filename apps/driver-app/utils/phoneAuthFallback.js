import apiService from './api';

class PhoneAuthFallback {
  constructor() {
    this.apiService = apiService;
  }

  // Send OTP using backend API instead of Firebase
  async sendOTP(phoneNumber) {
    try {
      console.log('📱 Sending OTP via backend API:', phoneNumber);
      
      const result = await this.apiService.sendOTP(phoneNumber);
      
      if (result.success) {
        console.log('✅ OTP sent via backend API');
        return { 
          success: true, 
          verificationId: 'backend-verification-' + Date.now(),
          message: result.message 
        };
      } else {
        console.error('❌ Backend OTP send failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error sending OTP via backend:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify OTP using backend API
  async verifyOTP(verificationId, otp, userData = {}) {
    try {
      console.log('🔐 Verifying OTP via backend API...');
      
      // Extract phone from verificationId (we stored it in the ID)
      const phone = verificationId.replace('backend-verification-', '');
      
      const result = await this.apiService.loginDriver(phone, otp, userData.name, userData.carInfo);
      
      if (result.token && result.driver) {
        console.log('✅ OTP verification successful via backend');
        return { 
          success: true, 
          user: {
            uid: result.driver.id,
            phoneNumber: result.driver.phone,
            displayName: result.driver.name,
            email: result.driver.email || null
          },
          token: result.token
        };
      } else {
        console.error('❌ Backend OTP verification failed:', result.error);
        return { success: false, error: result.error || 'Verification failed' };
      }
    } catch (error) {
      console.error('❌ Error verifying OTP via backend:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if backend is available
  async isBackendAvailable() {
    try {
      const status = this.apiService.getStatus();
      return status.isOnline;
    } catch (error) {
      console.error('❌ Error checking backend status:', error);
      return false;
    }
  }

  // Get test OTP for development
  getTestOTP() {
    return '123456';
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}

// Create singleton instance
const phoneAuthFallback = new PhoneAuthFallback();

export default phoneAuthFallback; 