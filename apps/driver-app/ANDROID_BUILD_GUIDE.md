# 🚗 Android Build Guide for Driver App

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Build Types](#build-types)
- [Local Development](#local-development)
- [EAS Build](#eas-build)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Release Process](#release-process)

## 🔧 Prerequisites

### **Required Software**
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI**: `npm install -g @expo/eas-cli`
- **Android Studio** (for local builds)
- **Android SDK** (API level 34)
- **Java Development Kit** (JDK 11 or higher)

### **Expo Account Setup**
```bash
# Login to Expo
eas login

# Configure your project
eas build:configure
```

### **Environment Variables**
Create a `.env` file in the project root:
```env
NODE_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3003
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
cd apps/driver-app
npm install
```

### **2. Start Development Server**
```bash
npm start
```

### **3. Run on Android Device/Emulator**
```bash
npm run android
```

## 📱 Build Types

### **Development Build**
```bash
# Using npm script
npm run android:dev

# Using EAS directly
eas build --platform android --profile development
```

**Features:**
- Debug mode enabled
- Development client included
- APK format for easy installation
- Hot reloading support

### **Preview Build**
```bash
# Using npm script
npm run android:preview

# Using EAS directly
eas build --platform android --profile preview
```

**Features:**
- Production-like environment
- APK format for testing
- No development client
- Optimized for testing

### **Production Build**
```bash
# Using npm script
npm run android:prod

# Using EAS directly
eas build --platform android --profile production
```

**Features:**
- Fully optimized
- AAB format for Play Store
- Code obfuscation enabled
- Resource shrinking enabled

## 🏠 Local Development

### **Setup Android Studio**
1. Install Android Studio
2. Install Android SDK (API 34)
3. Create Android Virtual Device (AVD)
4. Set ANDROID_HOME environment variable

### **Run Local Build**
```bash
# Start Metro bundler
npm start

# Run on connected device
npm run android:local

# Or use Expo CLI
npx expo run:android
```

### **Debug Local Build**
```bash
# Enable debugging
adb reverse tcp:8081 tcp:8081

# View logs
adb logcat | grep ReactNativeJS

# Install APK
adb install app-debug.apk
```

## ☁️ EAS Build

### **Build Configuration**
The app uses EAS Build with three profiles:

#### **Development Profile**
- **Purpose**: Development and testing
- **Output**: APK
- **Features**: Debug mode, development client
- **Size**: ~50-80MB

#### **Preview Profile**
- **Purpose**: Internal testing
- **Output**: APK
- **Features**: Production-like, no debug
- **Size**: ~30-50MB

#### **Production Profile**
- **Purpose**: Play Store release
- **Output**: AAB
- **Features**: Fully optimized, obfuscated
- **Size**: ~20-40MB

### **Build Commands**
```bash
# Development build
eas build --platform android --profile development

# Preview build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production

# Build for specific device
eas build --platform android --profile development --local
```

### **Build Status**
```bash
# Check build status
eas build:list

# Download build
eas build:download [BUILD_ID]
```

## ⚡ Performance Optimization

### **Code Optimization**
- **ProGuard**: Code obfuscation and shrinking
- **R8**: Advanced code optimization
- **Tree Shaking**: Remove unused code
- **Bundle Splitting**: Optimize download size

### **Resource Optimization**
- **Image Compression**: Optimize PNG/JPEG files
- **Vector Drawables**: Use scalable graphics
- **Resource Shrinking**: Remove unused resources
- **Asset Optimization**: Compress audio/video files

### **Build Optimization**
- **Parallel Execution**: Multi-threaded builds
- **Build Cache**: Faster subsequent builds
- **Incremental Compilation**: Only rebuild changed files
- **Gradle Optimization**: Optimized build scripts

### **Runtime Optimization**
- **Hermes Engine**: Faster JavaScript execution
- **Memory Management**: Optimized memory usage
- **Background Processing**: Efficient background tasks
- **Network Optimization**: Optimized API calls

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Build Fails with Gradle Error**
```bash
# Clean project
cd android
./gradlew clean
cd ..

# Clear cache
npm start -- --clear
```

#### **2. Metro Bundler Issues**
```bash
# Clear Metro cache
npx expo start --clear

# Reset cache
npx expo r -c
```

#### **3. Android SDK Issues**
```bash
# Check SDK installation
sdkmanager --list

# Install missing components
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
```

#### **4. Permission Issues**
```bash
# Grant storage permissions
adb shell pm grant com.esubvali.driverapp android.permission.WRITE_EXTERNAL_STORAGE

# Grant location permissions
adb shell pm grant com.esubvali.driverapp android.permission.ACCESS_FINE_LOCATION
```

#### **5. Google Maps Issues**
- Verify API key is correct
- Enable Maps SDK in Google Cloud Console
- Check billing is enabled

### **Debug Commands**
```bash
# View device logs
adb logcat

# Check device info
adb shell getprop

# Install APK
adb install -r app-debug.apk

# Uninstall app
adb uninstall com.esubvali.driverapp
```

## 📦 Release Process

### **1. Pre-Release Checklist**
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Privacy policy updated
- [ ] App store assets ready

### **2. Build Production Version**
```bash
# Build production AAB
npm run android:prod

# Wait for build completion
eas build:list
```

### **3. Test Production Build**
```bash
# Download and install
eas build:download [BUILD_ID]

# Test on multiple devices
# Verify all features work
# Check performance metrics
```

### **4. Submit to Play Store**
```bash
# Submit to internal testing
eas submit --platform android --profile preview

# Submit to production
eas submit --platform android --profile production
```

### **5. Monitor Release**
- Track crash reports
- Monitor performance metrics
- Collect user feedback
- Plan next release

## 📊 Build Metrics

### **Target Metrics**
- **APK Size**: < 50MB (development), < 30MB (production)
- **Install Time**: < 30 seconds
- **Startup Time**: < 3 seconds
- **Memory Usage**: < 200MB
- **Battery Impact**: < 5% per hour

### **Performance Monitoring**
```bash
# Check app performance
adb shell dumpsys meminfo com.esubvali.driverapp

# Monitor CPU usage
adb shell top -p $(adb shell pidof com.esubvali.driverapp)

# Check network usage
adb shell dumpsys netstats
```

## 🔐 Security Considerations

### **Code Protection**
- ProGuard obfuscation enabled
- API keys stored securely
- Sensitive data encrypted
- Network traffic secured

### **Permission Management**
- Minimal required permissions
- Runtime permission requests
- Permission justification provided
- Background location limited

### **Data Protection**
- Local data encrypted
- Network data secured (HTTPS)
- User data anonymized
- GDPR compliance

## 📞 Support

### **Getting Help**
- Check [Expo Documentation](https://docs.expo.dev/)
- Visit [React Native Docs](https://reactnative.dev/)
- Join [Expo Discord](https://discord.gg/expo)
- Review [Android Developer Docs](https://developer.android.com/)

### **Useful Commands**
```bash
# Check Expo status
expo doctor

# Update Expo SDK
expo upgrade

# Check for outdated packages
npm outdated

# Security audit
npm audit
```

---

**Happy Building! 🚗✨** 