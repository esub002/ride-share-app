import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import apiService from "./utils/api";
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

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize API service
        await apiService.init();
        
        // Check if user is already logged in
        const status = apiService.getStatus();
        if (status.hasToken) {
          // User is already logged in, get profile and proceed
          try {
            const profile = await apiService.getDriverProfile();
            onLogin(apiService.token, profile);
            return;
          } catch (error) {
            // Token is invalid, clear it
            apiService.clearToken();
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  const handleSendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      console.log(`📱 Sending OTP to: ${phone}`);
      
      const result = await apiService.sendOTP(phone);
      
      if (result.success) {
        setStep('otp');
        setError(`OTP sent! Use code: ${result.otp || '123456'}`); // Show OTP for testing
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error(`❌ OTP send error:`, error);
      setError(`Network error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setError("");
    setLoading(true);
    try {
      console.log(`🔐 Verifying OTP for: ${phone}`);
      
      const loginData = await apiService.loginDriver(phone, otp, name, carInfo);
      
      if (loginData.token) {
        // Success - driver logged in or registered
        const driverProfile = {
          id: loginData.driver.id,
          name: loginData.driver.name,
          phone: loginData.driver.phone,
          car: loginData.driver.car_info,
          email: loginData.driver.email
        };
        
        console.log('✅ Login successful:', driverProfile);
        onLogin(loginData.token, driverProfile);
      } else {
        // Check if this is a new user that needs registration
        if (loginData.error && loginData.error.includes('Name and car information required')) {
          setIsNewUser(true);
          setError("Please provide your details to complete registration");
        } else {
          setError(loginData.error || "OTP verification failed");
        }
      }
    } catch (error) {
      console.error(`❌ OTP verification error:`, error);
      
      // Handle specific error cases
      if (error.message.includes('Name and car information required')) {
        setIsNewUser(true);
        setError("Please provide your details to complete registration");
      } else {
        setError(`Verification failed: ${error.message}`);
      }
    }
    setLoading(false);
  };

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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              🧪 Test OTP: <Text style={styles.highlightText}>123456</Text>
            </Text>
          </Card>

          {/* Main Form Card */}
          <Card 
            variant="elevated" 
            size="large" 
            style={styles.formCard}
          >
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
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={15}
                  leftIcon="call"
                  required
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
                    />
                    
                    <Input
                      label="Vehicle Information"
                      placeholder="e.g., Toyota Prius 2020"
                      value={carInfo}
                      onChangeText={setCarInfo}
                      autoCapitalize="words"
                      leftIcon="car"
                      required
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
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure • Fast • Reliable
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
});
  