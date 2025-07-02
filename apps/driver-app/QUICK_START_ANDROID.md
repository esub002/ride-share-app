# 🚀 Quick Start Guide - Enhanced Android Build System

## ⚡ Get Started in 5 Minutes

### **1. Prerequisites Check**
```bash
# Check if you have the required tools
node --version  # Should be 18+
npm --version   # Should be 8+
eas --version   # Should be 16.13.1+
```

### **2. Setup Project**
```bash
cd apps/driver-app

# Install dependencies
npm install

# Login to Expo (if not already logged in)
eas login
```

### **3. First Build**
```bash
# Development build (recommended for first time)
npm run build:android:dev

# Or use interactive mode
npm run build:android:interactive
```

### **4. Install on Device**
```bash
# Download and install the APK on your Android device
# The build will provide a download link
```

## 🎯 Common Workflows

### **Daily Development**
```bash
# Start development server
npm start

# Run on connected device
npm run android:local

# Or build development APK
npm run build:android:dev
```

### **Testing New Features**
```bash
# Build preview version
npm run build:android:preview

# Test with staging API
npm run build:android:staging
```

### **Production Release**
```bash
# Optimize the app
npm run optimize:android

# Build production AAB
npm run build:android:prod

# Submit to Play Store
npm run submit:android
```

## 🔧 Essential Commands

### **Build Commands**
```bash
# Quick builds
npm run build:android:dev      # Development
npm run build:android:preview  # Preview
npm run build:android:prod     # Production

# Advanced builds
npm run build:android:staging  # Staging
npm run build:android:testing  # Testing
npm run build:android:parallel development preview  # Parallel
```

### **Optimization Commands**
```bash
# Full optimization
npm run optimize:android

# Specific optimizations
npm run optimize:android:images   # Image compression
npm run optimize:android:bundle   # Bundle optimization
npm run optimize:android:proguard # Code obfuscation
```

### **Utility Commands**
```bash
# Clean build artifacts
npm run android:clean

# Show build information
npm run android:info

# Generate reports
node scripts/enhanced-android-build.js report
```

## 📱 Build Profiles Explained

| Profile | Size | Use Case | Features |
|---------|------|----------|----------|
| **Development** | 50-80MB | Daily dev | Debug, hot reload, dev client |
| **Preview** | 30-50MB | Internal testing | Production-like, no debug |
| **Staging** | 25-40MB | QA testing | Staging API, production-like |
| **Production** | 20-35MB | Play Store | Optimized, obfuscated, AAB |
| **Testing** | 45-70MB | QA/Testing | Debug, testing API, logging |

## ⚡ Performance Tips

### **Before Building**
```bash
# Clean previous builds
npm run android:clean

# Optimize assets
npm run optimize:android:images

# Check bundle size
npm run optimize:android:bundle
```

### **During Development**
```bash
# Use local builds for faster iteration
npm run android:local

# Monitor performance
# Use AdvancedAndroidFeatures component
```

### **For Production**
```bash
# Run full optimization
npm run optimize:android

# Build with production profile
npm run build:android:prod

# Test thoroughly before release
```

## 🐛 Quick Troubleshooting

### **Build Fails**
```bash
# Clean and retry
npm run android:clean
npm run build:android:dev

# Check logs
eas build:list
```

### **Performance Issues**
```bash
# Run optimizations
npm run optimize:android

# Check system info
node scripts/enhanced-android-build.js info
```

### **Permission Issues**
```bash
# Use the AdvancedAndroidFeatures component
# Grant permissions manually in device settings
```

## 📊 Monitoring & Analytics

### **Build Performance**
```bash
# Generate build report
node scripts/enhanced-android-build.js report

# View optimization report
node scripts/android-optimizer.js report
```

### **App Performance**
- Use the `AdvancedAndroidFeatures` component
- Monitor memory usage, battery level, location accuracy
- Check system information and device capabilities

## 🔒 Security Checklist

### **Before Production Release**
- [ ] Network security configured
- [ ] ProGuard obfuscation enabled
- [ ] HTTPS enforced for all API calls
- [ ] Sensitive data encrypted
- [ ] Permissions properly configured

### **Regular Security**
- [ ] Update dependencies regularly
- [ ] Review security configurations
- [ ] Monitor for vulnerabilities
- [ ] Test security features

## 🚀 Next Steps

### **Advanced Features**
1. **Performance Monitoring**: Implement real-time metrics
2. **Advanced Permissions**: Configure system-level permissions
3. **Background Processing**: Optimize background tasks
4. **Security Hardening**: Implement additional security measures

### **CI/CD Integration**
1. **GitHub Actions**: Set up automated builds
2. **Play Store**: Configure automated deployment
3. **Testing**: Implement automated testing pipeline
4. **Monitoring**: Set up build and performance monitoring

### **Customization**
1. **Build Profiles**: Customize for your specific needs
2. **Optimizations**: Add custom optimization rules
3. **Features**: Extend with additional Android features
4. **Analytics**: Implement custom build analytics

## 📞 Need Help?

### **Documentation**
- [Enhanced Android Build README](./ENHANCED_ANDROID_BUILD_README.md)
- [Android Build Guide](./ANDROID_BUILD_GUIDE.md)
- [Driver Features](./DRIVER_FEATURES.md)

### **Commands Reference**
```bash
# Show all available commands
npm run

# Get help for build script
node scripts/enhanced-android-build.js help

# Get help for optimizer
node scripts/android-optimizer.js help
```

### **Community Support**
- [Expo Discord](https://discord.gg/expo)
- [React Native Community](https://github.com/react-native-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

---

**🎉 You're now ready to build, optimize, and deploy your Android app with the enhanced build system!** 