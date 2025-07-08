# OTP Login Component Usage Guide

## Overview

The `OTPLogin.js` component provides a complete Firebase OTP authentication flow with the following features:

- **Firebase Phone Authentication**: Uses Firebase Auth for secure OTP verification
- **User Registration**: Handles new user registration with profile creation
- **Backend Integration**: Integrates with your backend API for user management
- **Real-time Validation**: Provides real-time OTP validation and error handling
- **Responsive Design**: Works on both iOS and Android with proper keyboard handling
- **Animations**: Smooth animations for better user experience

## Basic Usage

### 1. Import the Component

```javascript
import OTPLogin from './OTPLogin';
```

### 2. Use in Your Login Screen

```javascript
import React, { useState } from 'react';
import { View } from 'react-native';
import OTPLogin from './OTPLogin';

export default function LoginScreen({ onLogin }) {
  const [showOTP, setShowOTP] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const handleSendOTP = async (phone) => {
    try {
      const result = await firebaseAuthService.signInWithPhone(phone);
      if (result.success) {
        setConfirmation(result.confirmation);
        setPhoneNumber(phone);
        setShowOTP(true);
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
    }
  };

  const handleResendOTP = async () => {
    return await handleSendOTP(phoneNumber);
  };

  const handleBackFromOTP = () => {
    setShowOTP(false);
    setConfirmation(null);
  };

  if (showOTP) {
    return (
      <OTPLogin
        phoneNumber={phoneNumber}
        onLogin={onLogin}
        onBack={handleBackFromOTP}
        onResendOTP={handleResendOTP}
        confirmation={confirmation}
      />
    );
  }

  // Your phone input screen
  return (
    <View>
      {/* Phone input form */}
    </View>
  );
}
```

## Component Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `phoneNumber` | `string` | The phone number to verify |
| `onLogin` | `function` | Callback when login is successful |
| `onBack` | `function` | Callback when user wants to go back |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onResendOTP` | `function` | `null` | Callback to resend OTP |
| `confirmation` | `object` | `null` | Firebase confirmation object |

## Callback Functions

### onLogin(uid, userData)

Called when authentication is successful.

```javascript
const handleLogin = (uid, userData) => {
  console.log('User logged in:', userData);
  // Navigate to main app
  navigation.replace('DriverHome');
};
```

### onBack()

Called when user wants to go back to phone input.

```javascript
const handleBack = () => {
  setShowOTP(false);
  setConfirmation(null);
};
```

### onResendOTP()

Called when user wants to resend OTP. Should return a promise.

```javascript
const handleResendOTP = async () => {
  try {
    const result = await firebaseAuthService.signInWithPhone(phoneNumber);
    if (result.success) {
      setConfirmation(result.confirmation);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Firebase Setup

### 1. Firebase Configuration

Ensure your Firebase project is configured for phone authentication:

```javascript
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 2. Enable Phone Authentication

In Firebase Console:
1. Go to Authentication > Sign-in method
2. Enable Phone Number provider
3. Add your app's SHA-1 fingerprint for Android
4. Configure reCAPTCHA settings

## Backend Integration

### 1. API Service Setup

The component integrates with your API service for user management:

```javascript
// utils/api.js
class ApiService {
  async checkUserExists(phoneNumber) {
    // Check if user exists in your backend
  }

  async googleSignUp(userData) {
    // Create user in your backend
  }

  async getDriverProfile() {
    // Get user profile from backend
  }
}
```

### 2. User Creation Flow

1. **OTP Verification**: Firebase verifies the OTP
2. **User Check**: Check if user exists in backend
3. **Profile Creation**: Create user profile if new user
4. **Login Complete**: Navigate to main app

## Styling

### Custom Styles

The component uses a consistent design system. You can customize styles by modifying the `styles` object:

```javascript
const customStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  otpInput: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  // ... other custom styles
});
```

### Theme Support

The component supports light/dark themes through the Colors constant:

```javascript
// constants/Colors.js
export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#666666',
    background: '#FFFFFF',
    border: '#E0E0E0',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    background: '#000000',
    border: '#333333',
  },
};
```

## Error Handling

### Common Errors

1. **Invalid Phone Number**
   ```javascript
   setError('Please enter a valid phone number');
   ```

2. **Invalid OTP**
   ```javascript
   setError('Invalid OTP. Please try again.');
   ```

3. **Network Error**
   ```javascript
   setError('Network error. Please check your connection.');
   ```

4. **Firebase Error**
   ```javascript
   setError('Authentication failed. Please try again.');
   ```

### Error Recovery

The component provides automatic error recovery:

- **Shake Animation**: Visual feedback for errors
- **Retry Logic**: Automatic retry for network errors
- **Resend OTP**: Manual resend option with countdown
- **Back Navigation**: Easy return to phone input

## Testing

### Test OTP Login

Use the provided test utility:

```javascript
import OTPLoginTester from './test-otp-login';

const tester = new OTPLoginTester();
await tester.runAllTests();
```

### Manual Testing

1. **Phone Input**: Enter valid phone number
2. **OTP Request**: Request OTP from Firebase
3. **OTP Verification**: Enter 6-digit OTP
4. **User Creation**: Complete profile for new users
5. **Login Success**: Navigate to main app

## Security Considerations

### 1. Phone Number Validation

```javascript
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};
```

### 2. OTP Rate Limiting

Firebase provides built-in rate limiting:
- Maximum 5 SMS per phone number per hour
- Maximum 10 SMS per phone number per day

### 3. User Data Protection

- Phone numbers are encrypted in Firebase
- User data is stored securely in your backend
- API tokens are managed securely

## Performance Optimization

### 1. Lazy Loading

```javascript
const OTPLogin = React.lazy(() => import('./OTPLogin'));
```

### 2. Memory Management

```javascript
useEffect(() => {
  return () => {
    // Cleanup on unmount
    setConfirmation(null);
    setOtp('');
  };
}, []);
```

### 3. Animation Optimization

```javascript
const animationConfig = {
  useNativeDriver: true,
  duration: 300,
};
```

## Troubleshooting

### Common Issues

1. **Firebase Not Initialized**
   ```javascript
   // Ensure Firebase is initialized before using OTP login
   await firebaseServiceManager.initialize();
   ```

2. **Phone Number Format**
   ```javascript
   // Use international format: +1234567890
   const formattedPhone = `+${countryCode}${phoneNumber}`;
   ```

3. **reCAPTCHA Issues**
   ```javascript
   // Configure reCAPTCHA in Firebase Console
   // Add SHA-1 fingerprint for Android
   ```

4. **Backend Connection**
   ```javascript
   // Check backend server status
   const status = await apiService.getStatus();
   ```

### Debug Mode

Enable debug logging:

```javascript
// Enable Firebase debug mode
if (__DEV__) {
  console.log('Firebase config:', firebaseConfig);
  console.log('OTP confirmation:', confirmation);
}
```

## Example Implementation

Here's a complete example of how to integrate OTP login:

```javascript
import React, { useState, useCallback } from 'react';
import { View, Alert } from 'react-native';
import OTPLogin from './OTPLogin';
import firebaseAuthService from './utils/firebaseAuthService';

export default function CompleteLoginScreen({ navigation }) {
  const [showOTP, setShowOTP] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const handleSendOTP = useCallback(async (phone) => {
    try {
      const result = await firebaseAuthService.signInWithPhone(phone);
      if (result.success) {
        setConfirmation(result.confirmation);
        setPhoneNumber(phone);
        setShowOTP(true);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    }
  }, []);

  const handleResendOTP = useCallback(async () => {
    return await handleSendOTP(phoneNumber);
  }, [phoneNumber, handleSendOTP]);

  const handleBackFromOTP = useCallback(() => {
    setShowOTP(false);
    setConfirmation(null);
  }, []);

  const handleLogin = useCallback((uid, userData) => {
    console.log('Login successful:', userData);
    navigation.replace('DriverHome');
  }, [navigation]);

  if (showOTP) {
    return (
      <OTPLogin
        phoneNumber={phoneNumber}
        onLogin={handleLogin}
        onBack={handleBackFromOTP}
        onResendOTP={handleResendOTP}
        confirmation={confirmation}
      />
    );
  }

  // Your phone input screen
  return (
    <View>
      {/* Phone input form */}
    </View>
  );
}
```

This implementation provides a complete, secure, and user-friendly OTP authentication flow for your driver app. 