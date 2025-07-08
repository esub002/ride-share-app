# Mock Firebase Authentication Guide

## 🎯 Overview

This guide explains how to use the Mock Firebase Authentication service that provides OTP functionality without requiring the actual Firebase SDK. This resolves dependency conflicts and allows you to test the app immediately.

## 🔧 How It Works

The Mock Firebase Auth service simulates the Firebase Authentication API with the following features:

- **Phone Number Validation**: Validates international phone number format
- **OTP Sending**: Simulates sending OTP (no actual SMS sent)
- **OTP Verification**: Accepts test OTP code `123456`
- **User Management**: Creates mock user objects
- **Auth State**: Tracks authentication state

## 📱 Usage

### 1. Phone Number Format
Use international format with country code:
- ✅ `+1234567890` (US)
- ✅ `+44123456789` (UK)
- ✅ `+61412345678` (Australia)
- ❌ `1234567890` (missing +)
- ❌ `+` (empty)

### 2. Test OTP Code
The mock service accepts the test OTP code: **`123456`**

### 3. Login Flow
1. Enter your phone number (any valid international format)
2. Tap "Send OTP"
3. Enter `123456` as the OTP
4. Complete login

## 🧪 Testing

### Quick Test
```javascript
import mockFirebaseAuth from './utils/mockFirebaseAuth';

// Initialize
await mockFirebaseAuth.initialize();

// Send OTP
const result = await mockFirebaseAuth.signInWithPhone('+1234567890');

// Verify OTP
const user = await mockFirebaseAuth.verifyOTP(result.confirmation, '123456');
```

### Run Test Suite
```javascript
import mockFirebaseTester from './test-mock-firebase';

// Run all tests
await mockFirebaseTester.runAllTests();

// Quick test
await mockFirebaseTester.quickTest();
```

## 🔄 Integration with App

The app is already configured to use the Mock Firebase Auth service:

1. **LoginScreen.js**: Uses `mockFirebaseAuth` for OTP sending
2. **OTPLogin.js**: Uses `mockFirebaseAuth` for OTP verification
3. **App.js**: Handles login flow with mock authentication

## 🎮 Test Scenarios

### Scenario 1: New User Registration
1. Enter phone number: `+1234567890`
2. Tap "Send OTP"
3. Enter OTP: `123456`
4. Complete registration form
5. User created and logged in

### Scenario 2: Existing User Login
1. Enter phone number: `+1234567890`
2. Tap "Send OTP"
3. Enter OTP: `123456`
4. User logged in directly

### Scenario 3: Invalid OTP
1. Enter phone number: `+1234567890`
2. Tap "Send OTP"
3. Enter wrong OTP: `000000`
4. Error message displayed

## 🔧 Configuration

### Test OTP Code
To change the test OTP code, edit `utils/mockFirebaseAuth.js`:
```javascript
class MockFirebaseAuth {
  constructor() {
    this.testOTP = '123456'; // Change this to your preferred test code
  }
}
```

### User Data
Mock user data is generated with:
- UID: `mock-user-{timestamp}`
- Display Name: "Mock Driver"
- Phone Number: The entered phone number

## 🚀 Benefits

1. **No Dependencies**: No Firebase SDK required
2. **Immediate Testing**: Works without configuration
3. **Consistent Behavior**: Predictable test environment
4. **Easy Debugging**: Clear console logs
5. **No Network Required**: Works offline

## 🔄 Migration to Real Firebase

When you're ready to use real Firebase:

1. Install Firebase dependencies:
   ```bash
   npm install @react-native-firebase/auth --legacy-peer-deps
   ```

2. Update imports in:
   - `LoginScreen.js`
   - `OTPLogin.js`

3. Replace `mockFirebaseAuth` with `reactNativeFirebaseAuth`

4. Configure Firebase project settings

## 🐛 Troubleshooting

### Issue: "Invalid phone number format"
**Solution**: Ensure phone number starts with `+` and includes country code

### Issue: "Invalid OTP code"
**Solution**: Use the test OTP code `123456`

### Issue: "No confirmation object"
**Solution**: Make sure to call `signInWithPhone` before `verifyOTP`

### Issue: App not responding
**Solution**: Check console logs for error messages

## 📊 Status Monitoring

Check the service status:
```javascript
const status = mockFirebaseAuth.getStatus();
console.log('Mock Firebase Status:', status);
```

## 🎉 Ready to Test!

Your app is now ready to test with mock Firebase authentication. Simply:

1. Start the app
2. Enter any valid phone number
3. Use OTP code `123456`
4. Enjoy testing all features!

The mock service provides a seamless development experience without Firebase dependency issues. 