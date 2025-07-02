#!/usr/bin/env node

/**
 * Enhanced Android Build Script for Driver App
 * Advanced build management with multiple profiles and optimizations
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BUILD_PROFILES = {
  DEVELOPMENT: {
    name: 'development',
    description: 'Development build with debug features',
    command: 'eas build --platform android --profile development',
    output: 'apk',
    features: ['debug', 'dev-client', 'hot-reload'],
    size: '50-80MB'
  },
  PREVIEW: {
    name: 'preview',
    description: 'Preview build for internal testing',
    command: 'eas build --platform android --profile preview',
    output: 'apk',
    features: ['optimized', 'no-debug', 'testing'],
    size: '30-50MB'
  },
  STAGING: {
    name: 'staging',
    description: 'Staging build for pre-production testing',
    command: 'eas build --platform android --profile staging',
    output: 'apk',
    features: ['production-like', 'staging-api', 'testing'],
    size: '25-40MB'
  },
  PRODUCTION: {
    name: 'production',
    description: 'Production build for Play Store release',
    command: 'eas build --platform android --profile production',
    output: 'aab',
    features: ['optimized', 'obfuscated', 'release'],
    size: '20-35MB'
  },
  TESTING: {
    name: 'testing',
    description: 'Testing build for QA',
    command: 'eas build --platform android --profile testing',
    output: 'apk',
    features: ['debug', 'testing-api', 'logging'],
    size: '45-70MB'
  }
};

class EnhancedAndroidBuilder {
  constructor() {
    this.buildLog = [];
    this.startTime = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const logMessage = `[${timestamp}] ${message}`;
    this.buildLog.push({ timestamp, message, type });
    
    console.log(`${colors[type]}${logMessage}${colors.reset}`);
  }

  async checkPrerequisites() {
    this.log('🔍 Checking build prerequisites...', 'info');
    
    const checks = [
      { name: 'EAS CLI', command: 'eas --version' },
      { name: 'Node.js', command: 'node --version' },
      { name: 'npm', command: 'npm --version' },
      { name: 'Expo CLI', command: 'expo --version' }
    ];

    for (const check of checks) {
      try {
        const result = execSync(check.command, { encoding: 'utf8' });
        this.log(`✅ ${check.name}: ${result.trim()}`, 'success');
      } catch (error) {
        this.log(`❌ ${check.name} not found or not working`, 'error');
        return false;
      }
    }

    // Check Expo login
    try {
      execSync('eas whoami', { stdio: 'pipe' });
      this.log('✅ Logged in to Expo', 'success');
    } catch (error) {
      this.log('❌ Not logged in to Expo. Please run: eas login', 'error');
      return false;
    }

    // Check project configuration
    if (!fs.existsSync('eas.json')) {
      this.log('❌ EAS configuration not found', 'error');
      return false;
    }

    this.log('✅ All prerequisites met', 'success');
    return true;
  }

  async cleanBuild() {
    this.log('🧹 Cleaning previous builds...', 'info');
    
    const cleanCommands = [
      'rm -rf android/app/build',
      'rm -rf android/.gradle',
      'rm -rf node_modules/.cache',
      'rm -rf .expo',
      'rm -rf dist',
      'npx expo install --fix'
    ];
    
    for (const command of cleanCommands) {
      try {
        execSync(command, { stdio: 'inherit' });
      } catch (error) {
        this.log(`⚠️ Clean command failed: ${command}`, 'warning');
      }
    }
    
    this.log('✅ Clean completed', 'success');
  }

  async runBuild(profileName) {
    const profile = BUILD_PROFILES[profileName.toUpperCase()];
    
    if (!profile) {
      this.log(`❌ Invalid build profile: ${profileName}`, 'error');
      this.showAvailableProfiles();
      return false;
    }

    this.startTime = Date.now();
    
    this.log(`🚀 Starting ${profile.name} build...`, 'info');
    this.log(`📝 ${profile.description}`, 'info');
    this.log(`📦 Output: ${profile.output.toUpperCase()}`, 'info');
    this.log(`🔧 Features: ${profile.features.join(', ')}`, 'info');
    this.log(`📏 Estimated size: ${profile.size}`, 'info');
    
    try {
      execSync(profile.command, { stdio: 'inherit' });
      
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      this.log(`✅ ${profile.name} build completed successfully in ${duration}s!`, 'success');
      
      return true;
    } catch (error) {
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      this.log(`❌ ${profile.name} build failed after ${duration}s`, 'error');
      return false;
    }
  }

  async runLocalBuild() {
    this.log('🏠 Starting local Android build...', 'info');
    
    try {
      // Check Android SDK
      execSync('adb devices', { stdio: 'pipe' });
      this.log('✅ Android SDK detected', 'success');
      
      // Run local build
      execSync('npx expo run:android', { stdio: 'inherit' });
      this.log('✅ Local build completed', 'success');
      return true;
    } catch (error) {
      this.log('❌ Local build failed. Check Android SDK installation', 'error');
      return false;
    }
  }

  async runParallelBuilds(profiles) {
    this.log(`🔄 Starting parallel builds for: ${profiles.join(', ')}`, 'info');
    
    const buildPromises = profiles.map(profile => this.runBuild(profile));
    const results = await Promise.allSettled(buildPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;
    
    this.log(`📊 Parallel builds completed: ${successful} successful, ${failed} failed`, 'info');
    
    return results;
  }

  async analyzeBuild() {
    this.log('📊 Analyzing build performance...', 'info');
    
    if (this.buildLog.length === 0) {
      this.log('⚠️ No build logs to analyze', 'warning');
      return;
    }

    const buildTimes = this.buildLog
      .filter(log => log.message.includes('build completed'))
      .map(log => {
        const match = log.message.match(/(\d+)s/);
        return match ? parseInt(match[1]) : 0;
      });

    if (buildTimes.length > 0) {
      const avgTime = Math.round(buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length);
      this.log(`📈 Average build time: ${avgTime}s`, 'info');
      this.log(`📈 Fastest build: ${Math.min(...buildTimes)}s`, 'info');
      this.log(`📈 Slowest build: ${Math.max(...buildTimes)}s`, 'info');
    }
  }

  showAvailableProfiles() {
    this.log('📋 Available build profiles:', 'info');
    Object.values(BUILD_PROFILES).forEach(profile => {
      this.log(`  ${profile.name.toUpperCase()}: ${profile.description}`, 'info');
      this.log(`    Output: ${profile.output.toUpperCase()} | Size: ${profile.size}`, 'info');
    });
  }

  async interactiveBuild() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.log('🎯 Interactive Build Mode', 'info');
    this.showAvailableProfiles();

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    const profileName = await question('\nSelect build profile (or "all" for parallel builds): ');
    const shouldClean = await question('Clean before build? (y/n): ');
    const shouldAnalyze = await question('Analyze build performance? (y/n): ');

    rl.close();

    if (shouldClean.toLowerCase() === 'y') {
      await this.cleanBuild();
    }

    let success = false;
    if (profileName.toLowerCase() === 'all') {
      const results = await this.runParallelBuilds(Object.keys(BUILD_PROFILES));
      success = results.some(r => r.status === 'fulfilled' && r.value);
    } else {
      success = await this.runBuild(profileName);
    }

    if (shouldAnalyze.toLowerCase() === 'y') {
      await this.analyzeBuild();
    }

    return success;
  }

  async generateBuildReport() {
    const report = {
      timestamp: new Date().toISOString(),
      buildLog: this.buildLog,
      summary: {
        totalBuilds: this.buildLog.filter(log => log.message.includes('build completed')).length,
        successfulBuilds: this.buildLog.filter(log => log.message.includes('build completed successfully')).length,
        failedBuilds: this.buildLog.filter(log => log.message.includes('build failed')).length
      }
    };

    const reportPath = `build-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 Build report saved to: ${reportPath}`, 'success');
    return reportPath;
  }
}

async function main() {
  const builder = new EnhancedAndroidBuilder();
  const args = process.argv.slice(2);
  const command = args[0];

  builder.log('🚗 Enhanced Driver App Android Build Script', 'info');
  builder.log('============================================', 'info');

  try {
    switch (command) {
      case 'dev':
      case 'development':
        if (await builder.checkPrerequisites()) {
          await builder.cleanBuild();
          await builder.runBuild('development');
        }
        break;
        
      case 'preview':
        if (await builder.checkPrerequisites()) {
          await builder.cleanBuild();
          await builder.runBuild('preview');
        }
        break;
        
      case 'staging':
        if (await builder.checkPrerequisites()) {
          await builder.cleanBuild();
          await builder.runBuild('staging');
        }
        break;
        
      case 'prod':
      case 'production':
        if (await builder.checkPrerequisites()) {
          await builder.cleanBuild();
          await builder.runBuild('production');
        }
        break;
        
      case 'testing':
        if (await builder.checkPrerequisites()) {
          await builder.cleanBuild();
          await builder.runBuild('testing');
        }
        break;
        
      case 'parallel':
        if (await builder.checkPrerequisites()) {
          const profiles = args.slice(1);
          if (profiles.length === 0) {
            builder.log('❌ Please specify profiles for parallel build', 'error');
            builder.showAvailableProfiles();
            break;
          }
          await builder.runParallelBuilds(profiles);
        }
        break;
        
      case 'local':
        await builder.runLocalBuild();
        break;
        
      case 'clean':
        await builder.cleanBuild();
        break;
        
      case 'interactive':
      case 'i':
        await builder.interactiveBuild();
        break;
        
      case 'report':
        await builder.generateBuildReport();
        break;
        
      case 'info':
        builder.showAvailableProfiles();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        builder.log('📖 Enhanced Android Build Script Usage:', 'info');
        builder.log('  node scripts/enhanced-android-build.js <command> [options]', 'info');
        builder.log('', 'info');
        builder.log('Commands:', 'info');
        builder.log('  dev/development    - Development build', 'info');
        builder.log('  preview           - Preview build', 'info');
        builder.log('  staging           - Staging build', 'info');
        builder.log('  prod/production   - Production build', 'info');
        builder.log('  testing           - Testing build', 'info');
        builder.log('  parallel <profiles> - Run multiple builds in parallel', 'info');
        builder.log('  local             - Local development build', 'info');
        builder.log('  clean             - Clean build artifacts', 'info');
        builder.log('  interactive/i     - Interactive build mode', 'info');
        builder.log('  report            - Generate build report', 'info');
        builder.log('  info              - Show available profiles', 'info');
        builder.log('  help              - Show this help', 'info');
        break;
        
      default:
        builder.log(`❌ Unknown command: ${command}`, 'error');
        builder.log('Run "node scripts/enhanced-android-build.js help" for usage', 'info');
        process.exit(1);
    }
  } catch (error) {
    builder.log(`❌ Build script error: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { EnhancedAndroidBuilder, BUILD_PROFILES }; 