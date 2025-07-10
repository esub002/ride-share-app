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
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import apiService from './utils/api';
import firebaseAuthService from './utils/firebaseAuthService';
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing, BorderRadius, Shadows } from './constants/Spacing';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import PhoneInput from 'react-native-phone-number-input';

export default function LoginScreen({ onLogin }) {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
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
  const [confirmation, setConfirmation] = useState(null);

  // Initialise auth service once
  useEffect(() => {
    (async () => {
      await firebaseAuthService.initialize();
    })();
  }, []);

  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false); // retained for possible mock mode quick-fill
  
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

    initializeApp();
  }, []);

  const handleSendOTP = useCallback(async () => {
    console.log('🔵 Send OTP button pressed');

    if (!formattedPhone || formattedPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await firebaseAuthService.signInWithPhone(formattedPhone);
      if (result.success && result.confirmation) {
        setConfirmation(result.confirmation);
        setStep('otp');

        // If using mock auth service, auto-fill test OTP to speed dev
        if (firebaseAuthService.useMockAuth) {
          setOtp('123456');
        }
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Unexpected error sending OTP');
    } finally {
      setLoading(false);
    }
  }, [formattedPhone]);

  const handleVerifyOTP = useCallback(async () => {
    if (!isOTPValid()) return;

    if (!confirmation) {
      setError('Please request OTP again');
      setStep('phone');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await firebaseAuthService.verifyOTP(confirmation, otp);
      if (result.success && result.user) {
        // For demo we create a mock token; in production exchange with backend.
        const token = 'session-' + Date.now();
        onLogin(token, result.user);
      } else {
        setError(result.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      setError(err.message || 'Unexpected error verifying OTP');
    } finally {
      setLoading(false);
    }
  }, [confirmation, otp, onLogin]);

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
            🔗 Connected to Backend API{'\n'}
            📱 Login via mobile number and OTP{'\n'}
            🧪 <Text style={styles.highlightText}>TEST MODE</Text> - Auto Login with Test OTP: <Text style={styles.highlightText}>123456</Text>{'\n'}
            🚀 <Text style={styles.highlightText}>IMMEDIATE LOGIN</Text> - Enter phone number to go directly to Driver Home{'\n'}
            ⚡ <Text style={styles.highlightText}>Instant access</Text> - No delays{'\n'}
            📱 Platform: {Platform.OS} | Version: {Platform.Version}
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
                title={
                  isAutoLoggingIn 
                    ? "🚀 Logging In..." 
                    : formattedPhone && formattedPhone.length >= 10 
                      ? "🚀 Immediate Login (Test Mode)" 
                      : "Enter Phone Number"
                }
                onPress={handleSendOTP}
                loading={loading || isAutoLoggingIn}
                disabled={!formattedPhone || formattedPhone.length < 10 || isAutoLoggingIn}
                icon={isAutoLoggingIn ? "rocket" : "key"}
                size="large"
                style={styles.submitButton}
              />
              
              {/* Debug info */}
              {__DEV__ && (
                <Text style={styles.debugText}>
                  Phone: {phone || 'none'} | Formatted: {formattedPhone || 'none'} | Length: {formattedPhone?.length || 0}
                </Text>
              )}

              {/* Skip Login Button */}
              <Button
                title="Skip Login"
                onPress={() => {
                  onLogin('mock-token', {
                    id: 'mock-driver',
                    name: 'Demo Driver',
                    phone: '+10000000000',
                    car: 'Demo Car',
                    email: 'demo@driver.com',
                  });
                }}
                variant="ghost"
                size="medium"
                style={styles.backButton}
              />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  
  keyboardView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.base,
  },
  
  loadingSpinner: {
    marginVertical: Spacing.lg,
  },
  
  loadingText: {
    ...Typography.body1,
    color: Colors.light.textSecondary,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  
  appTitle: {
    ...Typography.h1,
    color: Colors.light.text,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  
  appSubtitle: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  
  statusCard: {
    marginBottom: Spacing.xl,
  },
  
  statusText: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  highlightText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  
  formCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  
  formTitle: {
    ...Typography.h2,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  
  formSection: {
    // Form section styling
  },
  
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  
  phoneText: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    marginLeft: Spacing.sm,
  },
  
  registrationSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  
  helpText: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  
  submitButton: {
    marginTop: Spacing.lg,
  },
  
  backButton: {
    marginTop: Spacing.base,
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error + '10',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.error,
  },
  
  errorText: {
    ...Typography.body2,
    color: Colors.light.error,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  
  footerText: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
  
  testFocusButton: {
    marginRight: Spacing.base,
  },
  
  testInputContainer: {
    marginBottom: Spacing.xl,
  },
  
  testInputLabel: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  
  testInput: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: BorderRadius.lg,
  },
  
  minimalTestInput: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: BorderRadius.lg,
  },
  
  simpleTestContainer: {
    marginBottom: Spacing.xl,
  },
  
  simpleTestLabel: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  
  simpleTestInput: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: BorderRadius.lg,
  },
  
  directInputContainer: {
    marginBottom: Spacing.xl,
  },
  
  directInputLabel: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  
  directInput: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: BorderRadius.lg,
  },
  
  testOtpButton: {
    marginTop: Spacing.base,
  },
  
  debugText: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontFamily: 'monospace',
  },
  
  testOtpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  
  testOtpText: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success + '10',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.success,
  },
  
  successText: {
    ...Typography.body2,
    color: Colors.light.success,
    marginLeft: Spacing.sm,
    flex: 1,
  },
});
  