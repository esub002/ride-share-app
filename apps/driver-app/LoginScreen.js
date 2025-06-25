import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { API_BASE_URL } from "./utils/api";

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
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  const handleSendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      console.log(`Sending OTP to: ${API_BASE_URL}/api/auth/driver/send-otp`);
      const res = await fetch(`${API_BASE_URL}/api/auth/driver/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      console.log(`Response status: ${res.status}`);
      const data = await res.json();
      console.log(`Response data:`, data);
      
      if (res.ok) {
        setStep('otp');
        setError(`OTP sent! Use code: ${data.otp}`); // Show fake OTP for testing
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (e) {
      console.error(`Network error:`, e);
      setError(`Network error: ${e.message}`);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setError("");
    setLoading(true);
    try {
      console.log(`Verifying OTP to: ${API_BASE_URL}/api/auth/driver/verify-otp`);
      
      const requestBody = { phone, otp };
      
      // Always include name and car info if available (for new users)
      if (name.trim() && carInfo.trim()) {
        requestBody.name = name;
        requestBody.car_info = carInfo;
      }
      
      console.log('Request body:', requestBody);
      
      const res = await fetch(`${API_BASE_URL}/api/auth/driver/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      console.log(`Response status: ${res.status}`);
      const data = await res.json();
      console.log(`Response data:`, data);
      
      if (res.ok && data.token) {
        // Success - driver logged in or registered
        const driverProfile = {
          name: data.driver.name,
          phone: data.driver.phone,
          car: data.driver.car_info
        };
        onLogin(data.token, driverProfile);
      } else {
        // Check if this is a new user that needs registration
        if (data.error && data.error.includes('Name and car information required')) {
          // This is a new user, show registration form
          setIsNewUser(true);
          setError("Please provide your details to complete registration");
        } else {
          setError(data.error || "OTP verification failed");
        }
      }
    } catch (e) {
      console.error(`Network error:`, e);
      setError(`Network error: ${e.message}`);
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

  return (
    <View style={styles.container}>
      <Text style={styles.infoBox}>
        Login/Register is now via mobile number and OTP only. Use the fake OTP: 123456. Email/password login is disabled.
      </Text>
      <Text style={styles.title}>
        {step === 'phone' ? "Driver Login" : isNewUser ? "Complete Registration" : "Enter OTP"}
      </Text>
      
      {step === 'phone' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={15}
          />
          
          <TouchableOpacity
            style={[styles.button, (!isPhoneValid() || loading) && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading || !isPhoneValid()}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </TouchableOpacity>
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={styles.phoneText}>OTP sent to: {phone}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
          />

          {isNewUser && (
            <>
              <Text style={styles.helpText}>
                Please provide your details to complete registration
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Enter car information (e.g., Toyota Prius)"
                value={carInfo}
                onChangeText={setCarInfo}
                autoCapitalize="words"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.button, (!isOTPValid() || loading) && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading || !isOTPValid()}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isNewUser ? "Complete Registration" : "Verify OTP"}</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleSendOTP}
            disabled={loading}
          >
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.switchButton}
        onPress={resetForm}
      >
        <Text style={styles.switchText}>
          {step === 'phone' ? "Back to Login" : "Change Phone Number"}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f7fb",
  },
  infoBox: {
    backgroundColor: '#e6f7ff',
    color: '#007aff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 18,
    width: '90%',
    textAlign: 'center',
    fontSize: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#222",
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    backgroundColor: "#fff",
    marginBottom: 18,
  },
  button: {
    width: "80%",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#007aff",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  phoneText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  resendButton: {
    marginTop: 15,
    padding: 10,
  },
  resendText: {
    color: "#007aff",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchText: {
    color: "#007aff",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  error: {
    color: "red",
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  helpText: {
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
});
  