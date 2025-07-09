# 🔥 Firebase Setup Guide for Driver App

## 📋 Prerequisites
- Firebase project created
- React Native project set up
- Android/iOS development environment

---

## 🚀 Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
- Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
- Click "Create a project" or "Add project"

### 1.2 Create New Project
- Enter project name (e.g., "driver-app")
- Enable Google Analytics (optional)
- Click "Create project"

---

## 🔧 Step 2: Configure Firebase for Your App

### 2.1 Add Android App
1. In Firebase Console, click "Add app" → "Android"
2. Enter package name: `com.esubvali.driverapp`
3. Enter app nickname: "Driver App"
4. Click "Register app"
5. **Download `google-services.json`** - Save this file!

### 2.2 Add iOS App (if needed)
1. Click "Add app" → "iOS"
2. Enter bundle ID: `com.esubvali.driverapp`
3. Enter app nickname: "Driver App"
4. Click "Register app"
5. **Download `GoogleService-Info.plist`** - Save this file!

---

## 📱 Step 3: Add Files to Your Project

### 3.1 Android Setup
```bash
# Copy google-services.json to android/app/
cp google-services.json apps/driver-app/android/app/
```

### 3.2 iOS Setup (if needed)
```bash
# Copy GoogleService-Info.plist to ios/
cp GoogleService-Info.plist apps/driver-app/ios/
```

---

## 🔑 Step 4: Get Your Firebase Credentials

### 4.1 Get Project Settings
1. In Firebase Console, click the gear icon → "Project settings"
2. Go to "General" tab
3. Scroll down to "Your apps" section

### 4.2 Copy Configuration Values
You need these values for `firebaseConfig.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...", // Web API Key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abc123",
  measurementId: "G-ABC123DEF" // Optional
};
```

---

## 🔐 Step 5: Enable Phone Authentication

### 5.1 Enable Phone Auth
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Click "Phone" → "Enable"
5. Click "Save"

### 5.2 Configure Phone Auth (Optional)
- Add test phone numbers for development
- Set up reCAPTCHA verification
- Configure SMS templates

---

## 📝 Step 6: Update Your Configuration

### 6.1 Update firebaseConfig.js
Replace the placeholder values in `apps/driver-app/firebaseConfig.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 6.2 Verify Package Name
Make sure your `app.json` has the correct package name:
```json
{
  "android": {
    "package": "com.esubvali.driverapp"
  }
}
```

---

## 🧪 Step 7: Test Your Setup

### 7.1 Run the Test Script
```bash
cd apps/driver-app
node test-firebase-integration.js
```

### 7.2 Test OTP Flow
1. Start your app
2. Enter a phone number in international format (+1234567890)
3. Check if you receive the OTP SMS

---

## 🔍 Troubleshooting

### Common Issues:

#### 1. "Firebase not configured" Error
- Make sure you updated `firebaseConfig.js` with real credentials
- Check that all values are correct

#### 2. "Invalid phone number" Error
- Use international format: +1234567890
- Make sure phone authentication is enabled in Firebase Console

#### 3. "SMS quota exceeded" Error
- Add test phone numbers in Firebase Console
- Check your Firebase billing plan

#### 4. App crashes on startup
- Make sure `google-services.json` is in `android/app/`
- Check that package name matches in all files

#### 5. OTP not received
- Check if phone number is in correct format
- Verify Firebase project has phone auth enabled
- Check Firebase Console logs for errors

---

## 📞 Support

### Firebase Console Links:
- [Firebase Console](https://console.firebase.google.com/)
- [Authentication Settings](https://console.firebase.google.com/project/_/authentication/providers)
- [Project Settings](https://console.firebase.google.com/project/_/settings/general)

### Documentation:
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Phone Auth](https://firebase.google.com/docs/auth/android/phone-auth)

---

## ✅ Checklist

- [ ] Firebase project created
- [ ] Android app added to Firebase
- [ ] `google-services.json` downloaded and placed in `android/app/`
- [ ] Phone authentication enabled in Firebase Console
- [ ] `firebaseConfig.js` updated with real credentials
- [ ] App builds without errors
- [ ] OTP SMS received on test phone number

---

**Once you complete these steps, your Firebase OTP authentication should work! 🎉** 