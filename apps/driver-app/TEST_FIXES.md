# Test Guide: Keyboard and Backend Fixes

## 🎯 Issues Fixed

### 1. Keyboard Closing Automatically on Login Page
**Problem**: When clicking on the mobile number input field, the keyboard would close automatically.

**Solution Applied**:
- ✅ Updated `KeyboardAvoidingView` with proper `keyboardVerticalOffset`
- ✅ Changed `ScrollView` props:
  - `keyboardShouldPersistTaps="always"`
  - `keyboardDismissMode="none"`
  - `automaticallyAdjustKeyboardInsets={true}` (iOS)
- ✅ Added `blurOnSubmit={false}` to all input fields
- ✅ Added proper `returnKeyType` for better UX

### 2. Backend Port Conflict
**Problem**: Backend couldn't start because port 3000 was already in use.

**Solution Applied**:
- ✅ Updated `start-dev.js` to automatically find available ports
- ✅ Added fallback to port 3001, 3002, etc.
- ✅ Updated driver app API to test multiple backend URLs
- ✅ Added automatic backend discovery

## 🧪 How to Test

### Test 1: Keyboard Functionality
1. **Start the driver app**:
   ```bash
   cd apps/driver-app
   npm start
   ```

2. **Test the login page**:
   - Open the app on your device/simulator
   - Navigate to the login screen
   - Tap on "Enter your mobile number" field
   - **Expected**: Keyboard should open and stay open
   - Type a phone number (e.g., "1234567890")
   - **Expected**: Keyboard should remain open while typing
   - Tap outside the input field
   - **Expected**: Keyboard should close only when you tap outside

3. **Test OTP input**:
   - Complete the phone number step
   - Tap on "Enter 6-digit OTP" field
   - **Expected**: Keyboard should open and stay open
   - Type the OTP (e.g., "123456")
   - **Expected**: Keyboard should remain open

### Test 2: Backend Connection
1. **Start the backend**:
   ```bash
   cd backend
   npm run dev:mock
   ```

2. **Check backend status**:
   - Look for: `✅ Backend found: http://localhost:3001` (or similar)
   - The script should automatically find an available port

3. **Test API connection**:
   - In the driver app, check the status card
   - Should show: "🔗 Connected to Backend API"
   - Try logging in with test credentials:
     - Phone: Any 10-digit number
     - OTP: 123456

## 🔧 Manual Testing Steps

### Keyboard Test Checklist:
- [ ] Tap mobile number field → Keyboard opens
- [ ] Type in mobile number → Keyboard stays open
- [ ] Tap OTP field → Keyboard opens
- [ ] Type OTP → Keyboard stays open
- [ ] Tap name field (if new user) → Keyboard opens
- [ ] Type name → Keyboard stays open
- [ ] Tap vehicle field → Keyboard opens
- [ ] Type vehicle info → Keyboard stays open
- [ ] Tap outside any field → Keyboard closes

### Backend Test Checklist:
- [ ] Backend starts without port conflicts
- [ ] Driver app connects to backend
- [ ] Login process works with mock data
- [ ] OTP verification works
- [ ] User registration works (if new user)

## 🐛 If Issues Persist

### Keyboard Still Closing:
1. **Check device settings**:
   - iOS: Settings → General → Keyboard → Keyboards
   - Android: Settings → System → Languages & input → Virtual keyboard

2. **Clear app cache**:
   ```bash
   cd apps/driver-app
   npx expo start --clear
   ```

3. **Restart development server**:
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm start
   ```

### Backend Still Not Working:
1. **Check if port is still in use**:
   ```bash
   npx kill-port 3000 3001 3002
   ```

2. **Start backend manually**:
   ```bash
   cd backend
   node start-dev.js
   ```

3. **Check backend logs**:
   - Look for any error messages
   - Verify mock database is being used

## 📱 Expected Behavior

### Login Screen:
- **Mobile Number Field**: 
  - Tap → Keyboard opens with number pad
  - Type → Keyboard stays open
  - Max 15 characters allowed

- **OTP Field**:
  - Tap → Keyboard opens with number pad
  - Type → Keyboard stays open
  - Max 6 characters allowed

- **Name Field** (new users):
  - Tap → Keyboard opens with regular keyboard
  - Type → Keyboard stays open
  - Auto-capitalizes words

- **Vehicle Field** (new users):
  - Tap → Keyboard opens with regular keyboard
  - Type → Keyboard stays open
  - Auto-capitalizes words

### Backend Connection:
- **Status**: Shows "Connected to Backend API"
- **Login**: Works with any phone number + OTP "123456"
- **Registration**: Works for new users
- **Mock Data**: All features work with sample data

## ✅ Success Criteria

Both issues should be completely resolved:

1. **Keyboard Issue**: ✅ Fixed
   - Keyboard opens and stays open when tapping input fields
   - No automatic dismissal while typing
   - Proper keyboard types for different input fields

2. **Backend Issue**: ✅ Fixed
   - Backend starts without port conflicts
   - Driver app connects automatically
   - All login/registration features work

The driver app should now provide a smooth, professional user experience! 🎉 