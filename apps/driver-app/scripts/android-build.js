#!/usr/bin/env node

/**
 * Android Build Script for Driver App
 * Provides various build options and optimizations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_TYPES = {
  DEVELOPMENT: 'development',
  PREVIEW: 'preview',
  PRODUCTION: 'production'
};

const BUILD_OPTIONS = {
  [BUILD_TYPES.DEVELOPMENT]: {
    description: 'Development build with debug features',
    command: 'eas build --platform android --profile development',
    output: 'apk'
  },
  [BUILD_TYPES.PREVIEW]: {
    description: 'Preview build for testing',
    command: 'eas build --platform android --profile preview',
    output: 'apk'
  },
  [BUILD_TYPES.PRODUCTION]: {
    description: 'Production build for Play Store',
    command: 'eas build --platform android --profile production',
    output: 'aab'
  }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('🔍 Checking build prerequisites...', 'info');
  
  // Check if EAS CLI is installed
  try {
    execSync('eas --version', { stdio: 'pipe' });
    log('✅ EAS CLI is installed', 'success');
  } catch (error) {
    log('❌ EAS CLI not found. Please install with: npm install -g @expo/eas-cli', 'error');
    process.exit(1);
  }
  
  // Check if logged in to Expo
  try {
    execSync('eas whoami', { stdio: 'pipe' });
    log('✅ Logged in to Expo', 'success');
  } catch (error) {
    log('❌ Not logged in to Expo. Please run: eas login', 'error');
    process.exit(1);
  }
  
  // Check if project is configured
  if (!fs.existsSync('eas.json')) {
    log('❌ EAS configuration not found. Please run: eas build:configure', 'error');
    process.exit(1);
  }
  
  log('✅ All prerequisites met', 'success');
}

function cleanBuild() {
  log('🧹 Cleaning previous builds...', 'info');
  
  const cleanCommands = [
    'rm -rf android/app/build',
    'rm -rf android/.gradle',
    'rm -rf node_modules/.cache',
    'npx expo install --fix'
  ];
  
  cleanCommands.forEach(command => {
    try {
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      log(`⚠️ Clean command failed: ${command}`, 'warning');
    }
  });
  
  log('✅ Clean completed', 'success');
}

function runBuild(buildType) {
  const buildOption = BUILD_OPTIONS[buildType];
  
  if (!buildOption) {
    log(`❌ Invalid build type: ${buildType}`, 'error');
    log('Available types:', 'info');
    Object.keys(BUILD_OPTIONS).forEach(type => {
      log(`  - ${type}: ${BUILD_OPTIONS[type].description}`, 'info');
    });
    process.exit(1);
  }
  
  log(`🚀 Starting ${buildType} build...`, 'info');
  log(`📝 ${buildOption.description}`, 'info');
  log(`📦 Output: ${buildOption.output.toUpperCase()}`, 'info');
  
  try {
    execSync(buildOption.command, { stdio: 'inherit' });
    log(`✅ ${buildType} build completed successfully!`, 'success');
  } catch (error) {
    log(`❌ ${buildType} build failed`, 'error');
    process.exit(1);
  }
}

function runLocalBuild() {
  log('🏠 Starting local Android build...', 'info');
  
  try {
    // Check if Android SDK is available
    execSync('adb devices', { stdio: 'pipe' });
    log('✅ Android SDK detected', 'success');
    
    // Run local build
    execSync('npx expo run:android', { stdio: 'inherit' });
    log('✅ Local build completed', 'success');
  } catch (error) {
    log('❌ Local build failed. Make sure Android SDK is installed and configured', 'error');
    process.exit(1);
  }
}

function showBuildInfo() {
  log('📋 Build Information', 'info');
  log('==================', 'info');
  
  Object.keys(BUILD_OPTIONS).forEach(type => {
    const option = BUILD_OPTIONS[type];
    log(`${type.toUpperCase()}:`, 'info');
    log(`  Description: ${option.description}`, 'info');
    log(`  Output: ${option.output.toUpperCase()}`, 'info');
    log(`  Command: ${option.command}`, 'info');
    log('', 'info');
  });
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  log('🚗 Driver App Android Build Script', 'info');
  log('==================================', 'info');
  
  switch (command) {
    case 'dev':
    case 'development':
      checkPrerequisites();
      cleanBuild();
      runBuild(BUILD_TYPES.DEVELOPMENT);
      break;
      
    case 'preview':
      checkPrerequisites();
      cleanBuild();
      runBuild(BUILD_TYPES.PREVIEW);
      break;
      
    case 'prod':
    case 'production':
      checkPrerequisites();
      cleanBuild();
      runBuild(BUILD_TYPES.PRODUCTION);
      break;
      
    case 'local':
      runLocalBuild();
      break;
      
    case 'clean':
      cleanBuild();
      break;
      
    case 'info':
      showBuildInfo();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      log('📖 Usage:', 'info');
      log('  node scripts/android-build.js <command>', 'info');
      log('', 'info');
      log('Commands:', 'info');
      log('  dev, development  - Build development APK', 'info');
      log('  preview          - Build preview APK', 'info');
      log('  prod, production - Build production AAB', 'info');
      log('  local            - Run local Android build', 'info');
      log('  clean            - Clean build artifacts', 'info');
      log('  info             - Show build information', 'info');
      log('  help             - Show this help', 'info');
      break;
      
    default:
      log('❌ Unknown command. Use "help" to see available commands.', 'error');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  BUILD_TYPES,
  BUILD_OPTIONS,
  checkPrerequisites,
  cleanBuild,
  runBuild,
  runLocalBuild
}; 