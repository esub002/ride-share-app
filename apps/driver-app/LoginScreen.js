import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import apiService from './utils/api';
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing, BorderRadius, Shadows } from './constants/Spacing';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import PhoneInput from 'react-native-phone-number-input';
import googleSignInService from './utils/googleSignInService';
// import reactNativeFirebaseAuth from './utils/reactNativeFirebaseAuth';
import mockFirebaseAuth from './utils/mockFirebaseAuth';
import OTPLogin from './OTPLogin';

export default function LoginScreen({ onLogin }) {
  const [step, setStep] = useState('phone'); // 'phone', 'otp', or 'otp-screen'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [carInfo, setCarInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [formattedPhone, setFormattedPhone] = useState("");
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [confirmation, setConfirmation] = useState(null); // Store confirmation object for OTP
  const [authMethod, setAuthMethod] = useState('firebase'); // 'firebase' or 'backend'
  
  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        setBackendStatus('checking');
        
        // Initialize API service
        await apiService.init();
        
        // Test backend connection by checking status
        const status = apiService.getStatus();
        console.log('Backend status:', status);
        
        if (status.isOnline) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setBackendStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    const initializeGoogleSignIn = async () => {
      try {
        // Initialize Google Sign-In service
        await googleSignInService.initialize();
      } catch (error) {
        console.error('Google Sign-In initialization error:', error);
      }
    };

    // Initialize both services
    initializeApp();
    initializeGoogleSignIn();
  }, []);

  const handleSendOTP = useCallback(async () => {
    setError("");
    if (!formattedPhone || formattedPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      console.log('📱 Sending OTP to:', formattedPhone);
      
      // Initialize Mock Firebase Auth if not already done
      if (!mockFirebaseAuth.isInitialized) {
        await mockFirebaseAuth.initialize();
      }
      
      // Use Mock Firebase Auth for phone auth
      const result = await mockFirebaseAuth.signInWithPhone(formattedPhone);
      
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

  const handleResendOTP = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const result = await mockFirebaseAuth.signInWithPhone(formattedPhone);
      if (result.success && result.confirmation) {
        setConfirmation(result.confirmation);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [formattedPhone]);

  const handleBackFromOTP = useCallback(() => {
    setStep('phone');
    setConfirmation(null);
    setOtp("");
    setError("");
  }, []);

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
      const result = await mockFirebaseAuth.verifyOTP(confirmation, otp);
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

  const handleGoogleSignIn = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      console.log('🔄 Starting Google Sign-In process...');
      
      const result = await googleSignInService.signIn();
      
      if (result.success) {
        console.log('✅ Google Sign-In successful:', result.message);
        
        // Store user globally and set API token
        global.user = result.user;
        if (result.token) {
          apiService.setToken(result.token);
        }
        
        if (result.isNewUser) {
          // New user - show welcome message and redirect to profile setup
          Alert.alert(
            'Welcome! 🎉',
            result.message,
            [
              {
                text: 'Complete Profile',
                onPress: () => {
                  // Navigate to profile setup or complete login
                  onLogin(result.user.firebaseUid, result.user);
                }
              }
            ]
          );
        } else {
          // Existing user - complete login
          onLogin(result.user.firebaseUid, result.user);
        }
      } else {
        console.error('❌ Google Sign-In failed:', result.error);
        
        // Handle specific error cases
        if (result.code === 'CANCELLED') {
          setError('Sign-in was cancelled');
        } else if (result.code === 'PLAY_SERVICES_ERROR') {
          setError('Google Play Services not available. Please update Google Play Services.');
        } else if (result.code === 'BACKEND_ERROR') {
          setError('Server error. Please try again later.');
        } else {
          setError(result.error || 'Google Sign-In failed');
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error during Google Sign-In:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onLogin]);

  const handleTestLogin = useCallback(() => {
    // Simulate successful login for testing
    const mockUser = {
      id: 1,
      uid: 'test-user-' + Date.now(),
      phoneNumber: formattedPhone || '+1234567890',
      displayName: 'Test Driver',
      name: 'Test Driver',
      email: 'test@example.com',
      car: 'Demo Car',
      rating: 4.8,
      totalRides: 1250,
      totalEarnings: 15420.50
    };
    console.log('🧪 Test login with user:', mockUser);
    
    // Store user globally
    global.user = mockUser;
    
    onLogin(mockUser.uid, mockUser);
  }, [formattedPhone, onLogin]);

  const isPhoneValid = () => {
    return phoneInputRef.current?.isValidNumber(phone) && formattedPhone.length > 0;
  };

  const isOTPValid = () => {
    return otp.length === 6;
  };

  const isRegistrationValid = () => {
    return name.trim().length >= 2 && carInfo.trim().length > 0;
  };

  const resetForm = () => {
    setStep('phone');
    setPhone("");
    setOtp("");
    setName("");
    setCarInfo("");
    setError("");
    setIsNewUser(false);
    setAuthMethod('firebase');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="car" size={64} color={Colors.light.primary} />
          </View>
          <ActivityIndicator size="large" color={Colors.light.primary} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Initializing Driver App...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render OTP Login Screen
  if (step === 'otp-screen') {
    return (
      <OTPLogin
        phoneNumber={formattedPhone}
        onLogin={onLogin}
        onBack={handleBackFromOTP}
        onResendOTP={handleResendOTP}
        confirmation={confirmation}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="never"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={false}
        bounces={false}
        nestedScrollEnabled={true}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="car" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.appTitle}>Driver App</Text>
          <Text style={styles.appSubtitle}>Professional ride-sharing platform</Text>
        </View>

        {/* Status Card */}
        <Card 
          variant="outlined" 
          size="small" 
          style={styles.statusCard}
          leftIcon="checkmark-circle"
        >
          <Text style={styles.statusText}>
            🔗 Backend Status: {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}{'\n'}
            📱 Login via mobile number and OTP{'\n'}
            🧪 <Text style={styles.highlightText}>TEST MODE</Text> - Use OTP: <Text style={styles.highlightText}>123456</Text>{'\n'}
            🚀 <Text style={styles.highlightText}>IMMEDIATE LOGIN</Text> - Enter phone number to go directly to Driver Home{'\n'}
            ⚡ <Text style={styles.highlightText}>Instant access</Text> - No delays{'\n'}
            📱 Platform: {Platform.OS} | Version: {Platform.Version}{'\n'}
            🔐 Auth Method: {authMethod === 'firebase' ? 'Firebase' : 'Backend'}
          </Text>
        </Card>

        {/* Main Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {step === 'phone' ? "Welcome Back!" : isNewUser ? "Complete Registration" : "Enter OTP"}
          </Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.light.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : isAutoLoggingIn ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
              <Text style={styles.successText}>
                Immediate login successful! Redirecting to Driver Home...
              </Text>
            </View>
          ) : null}
          
          {step === 'phone' && (
            <View style={styles.formSection}>
              <PhoneInput
                ref={phoneInputRef}
                defaultValue={phone}
                defaultCode="US"
                layout="first"
                onChangeText={setPhone}
                onChangeFormattedText={setFormattedPhone}
                countryPickerProps={{ withAlphaFilter: true }}
                withShadow
                autoFocus={false}
                containerStyle={{ marginBottom: 16 }}
                textInputProps={{
                  placeholder: 'Enter your mobile number',
                  returnKeyType: 'done',
                  blurOnSubmit: true,
                  keyboardType: 'phone-pad',
                  accessible: true,
                  accessibilityLabel: 'Mobile Number',
                }}
              />
              <Button
                title={loading ? 'Sending OTP...' : 'Send OTP'}
                onPress={handleSendOTP}
                loading={loading}
                disabled={!isPhoneValid() || loading}
                icon="key"
                size="large"
                style={styles.submitButton}
              />
              
              {/* Test Mode Button for when Firebase phone auth fails */}
              <Button
                title="Test Mode Login (Skip Firebase)"
                onPress={handleTestLogin}
                variant="outlined"
                size="medium"
                style={{ marginTop: 8 }}
                textStyle={{ color: Colors.light.primary }}
              />
              
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <Button
                title="Continue with Google"
                onPress={handleGoogleSignIn}
                loading={loading}
                icon="logo-google"
                size="large"
                style={styles.googleButton}
                textStyle={{ color: 'white', fontWeight: '600' }}
              />
              
              <Text style={styles.googleSignInText}>
                Quick and secure sign-in with your Google account
              </Text>
              
              {/* Debug info */}
              {__DEV__ && (
                <Text style={styles.debugText}>
                  Phone: {phone || 'none'} | Formatted: {formattedPhone || 'none'} | Length: {formattedPhone?.length || 0}
                </Text>
              )}
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.formSection}>
              <View style={styles.phoneDisplay}>
                <Ionicons name="phone-portrait" size={20} color={Colors.light.icon} />
                <Text style={styles.phoneText}>OTP sent to: {formattedPhone}</Text>
              </View>
              
              <Input
                label="OTP Code"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                leftIcon="key"
                required
                returnKeyType="done"
                blurOnSubmit={false}
                ref={otpInputRef}
              />

              {/* Test OTP Info */}
              <View style={styles.testOtpInfo}>
                <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                <Text style={styles.testOtpText}>
                  Test OTP <Text style={styles.highlightText}>123456</Text> has been auto-filled
                </Text>
              </View>

              {isNewUser && (
                <View style={styles.registrationSection}>
                  <Text style={styles.helpText}>
                    Please provide your details to complete registration
                  </Text>
                  
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    leftIcon="person"
                    required
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                  
                  <Input
                    label="Vehicle Information"
                    placeholder="e.g., Toyota Prius 2020"
                    value={carInfo}
                    onChangeText={setCarInfo}
                    autoCapitalize="words"
                    leftIcon="car"
                    required
                    returnKeyType="done"
                    blurOnSubmit={false}
                  />
                </View>
              )}

              <Button
                title={isNewUser ? "Complete Registration" : "Verify OTP"}
                onPress={handleVerifyOTP}
                loading={loading}
                disabled={!isOTPValid() || (isNewUser && !isRegistrationValid())}
                icon="checkmark"
                size="large"
                style={styles.submitButton}
              />

              <Button
                title="← Back to Phone"
                onPress={resetForm}
                variant="ghost"
                size="medium"
                style={styles.backButton}
              />
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure • Fast • Reliable
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles (keep as in original, or simplify as needed) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: 24,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  highlightText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  formCard: {
    marginBottom: 24,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.error,
  },
  errorText: {
    color: Colors.light.error,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.success,
  },
  successText: {
    color: Colors.light.success,
    marginLeft: 8,
    flex: 1,
  },
  formSection: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  inputBox: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonOutlineText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    color: Colors.light.textSecondary,
    marginHorizontal: 8,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  googleSignInText: {
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  phoneText: {
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  testOtpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testOtpText: {
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  registrationSection: {
    marginBottom: 16,
  },
  helpText: {
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  submitButton: {
    marginBottom: 12,
  },
  backButton: {
    marginTop: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  debugText: {
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
});
  
  