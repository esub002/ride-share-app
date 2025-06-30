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
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import apiService from './utils/api';
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing, BorderRadius, Shadows } from './constants/Spacing';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';

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
    if (!isPhoneValid()) return;
    
    const currentPhone = phone; // Capture the current phone number
    
    try {
      console.log('Sending OTP to:', currentPhone);
      setLoading(true);
      setError('');
      
      const response = await apiService.sendOTP(currentPhone);
      console.log('OTP send response:', response);
      
      // The API returns { message: "OTP sent successfully", otp: "123456" }
      // We need to check for the message, not success property
      if (response.message && response.otp) {
        setStep('otp');
        // Ensure phone number is preserved
        if (phone !== currentPhone) {
          setPhone(currentPhone);
        }
        console.log('OTP sent successfully, moving to OTP step. Phone:', currentPhone);
      } else {
        setError(response.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [phone, isPhoneValid]);

  const handleVerifyOTP = useCallback(async () => {
    if (!isOTPValid()) return;
    
    try {
      console.log('Verifying OTP for:', phone);
      setLoading(true);
      setError('');
      
      const loginData = await apiService.loginDriver(phone, otp, name, carInfo);
      console.log('Login response:', loginData);
      
      if (loginData.token && loginData.driver) {
        onLogin(loginData.token, loginData.driver);
      } else {
        setError('Invalid OTP or login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [phone, otp, name, carInfo, onLogin, isOTPValid]);

  const isPhoneValid = () => {
    return phone.length >= 10 && phone.length <= 15;
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
            🧪 Test OTP: <Text style={styles.highlightText}>123456</Text>{'\n'}
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
          ) : null}
          
          {step === 'phone' && (
            <View style={styles.formSection}>
              <Input
                label="Mobile Number"
                placeholder="Enter your mobile number"
                value={phone}
                onChangeText={(text) => {
                  console.log('Phone number changed:', text);
                  setPhone(text);
                }}
                keyboardType="phone-pad"
                maxLength={15}
                leftIcon="call"
                required
                returnKeyType="done"
                blurOnSubmit={false}
                autoFocus={false}
                ref={phoneInputRef}
              />
              
              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={loading}
                disabled={!isPhoneValid()}
                icon="send"
                size="large"
                style={styles.submitButton}
              />

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
                <Text style={styles.phoneText}>OTP sent to: {phone}</Text>
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
});
  