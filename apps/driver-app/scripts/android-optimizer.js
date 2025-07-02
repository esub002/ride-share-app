#!/usr/bin/env node

/**
 * Android Build Optimizer for Driver App
 * Handles code optimization, resource management, and performance improvements
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AndroidOptimizer {
  constructor() {
    this.optimizationLog = [];
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
    this.optimizationLog.push({ timestamp, message, type });
    
    console.log(`${colors[type]}${logMessage}${colors.reset}`);
  }

  async optimizeImages() {
    this.log('🖼️ Optimizing images...', 'info');
    
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const assetsDir = path.join(__dirname, '../assets/images');
    
    if (!fs.existsSync(assetsDir)) {
      this.log('⚠️ Assets directory not found', 'warning');
      return;
    }

    try {
      // Install image optimization tools if not present
      try {
        execSync('which imagemin', { stdio: 'pipe' });
      } catch {
        this.log('📦 Installing image optimization tools...', 'info');
        execSync('npm install -g imagemin-cli imagemin-pngquant imagemin-mozjpeg', { stdio: 'inherit' });
      }

      // Optimize images
      const files = fs.readdirSync(assetsDir);
      let optimizedCount = 0;

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const filePath = path.join(assetsDir, file);
          const stats = fs.statSync(filePath);
          const originalSize = stats.size;

          try {
            execSync(`imagemin "${filePath}" --out-dir="${assetsDir}"`, { stdio: 'pipe' });
            
            const newStats = fs.statSync(filePath);
            const newSize = newStats.size;
            const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
            
            this.log(`✅ Optimized ${file}: ${originalSize} → ${newSize} bytes (${savings}% savings)`, 'success');
            optimizedCount++;
          } catch (error) {
            this.log(`⚠️ Failed to optimize ${file}`, 'warning');
          }
        }
      }

      this.log(`✅ Image optimization completed: ${optimizedCount} files processed`, 'success');
    } catch (error) {
      this.log(`❌ Image optimization failed: ${error.message}`, 'error');
    }
  }

  async optimizeBundle() {
    this.log('📦 Optimizing JavaScript bundle...', 'info');
    
    try {
      // Analyze bundle size
      execSync('npx expo export --platform android', { stdio: 'inherit' });
      
      // Enable tree shaking
      const metroConfig = path.join(__dirname, '../metro.config.js');
      if (fs.existsSync(metroConfig)) {
        let config = fs.readFileSync(metroConfig, 'utf8');
        
        if (!config.includes('minifierConfig')) {
          config += `
module.exports = {
  ...module.exports,
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    compress: {
      reduce_funcs: false,
    },
  },
};`;
          fs.writeFileSync(metroConfig, config);
          this.log('✅ Metro config optimized for bundle size', 'success');
        }
      }
      
      this.log('✅ Bundle optimization completed', 'success');
    } catch (error) {
      this.log(`❌ Bundle optimization failed: ${error.message}`, 'error');
    }
  }

  async configureProGuard() {
    this.log('🛡️ Configuring ProGuard for code optimization...', 'info');
    
    const proguardPath = path.join(__dirname, '../android/app/proguard-rules.pro');
    
    const proguardRules = `
# ProGuard rules for Driver App
# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# Keep Expo modules
-keep class expo.modules.** { *; }
-keep class expo.** { *; }

# Keep Google Maps
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.common.** { *; }

# Keep Socket.IO
-keep class io.socket.** { *; }

# Keep Firebase
-keep class com.google.firebase.** { *; }

# Keep location services
-keep class com.google.android.gms.location.** { *; }

# Keep notification services
-keep class com.google.firebase.messaging.** { *; }

# Remove debug logs in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}

# Optimize string operations
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enum values
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep R classes
-keep class **.R$* {
    public static <fields>;
}

# Keep custom application class
-keep class com.esubvali.driverapp.MainApplication { *; }
-keep class com.esubvali.driverapp.MainActivity { *; }
`;

    try {
      fs.writeFileSync(proguardPath, proguardRules);
      this.log('✅ ProGuard rules configured', 'success');
    } catch (error) {
      this.log(`❌ Failed to configure ProGuard: ${error.message}`, 'error');
    }
  }

  async optimizeGradleConfig() {
    this.log('⚙️ Optimizing Gradle configuration...', 'info');
    
    const gradlePath = path.join(__dirname, '../android/app/build.gradle');
    
    if (!fs.existsSync(gradlePath)) {
      this.log('⚠️ Gradle file not found', 'warning');
      return;
    }

    try {
      let gradleConfig = fs.readFileSync(gradlePath, 'utf8');
      
      // Add build optimizations
      const optimizations = `
android {
    // Existing config...
    
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // Enable R8 full mode
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // Optimize PNG files
            crunchPngs true
            
            // Enable resource shrinking
            shrinkResources true
            
            // Enable code shrinking
            minifyEnabled true
            
            // Optimize dex files
            dexOptions {
                preDexLibraries true
                maxProcessCount 8
                javaMaxHeapSize "4g"
            }
        }
    }
    
    // Enable build cache
    buildCache {
        enabled true
    }
    
    // Enable parallel execution
    dexOptions {
        preDexLibraries true
        maxProcessCount 8
        javaMaxHeapSize "4g"
    }
    
    // Enable incremental compilation
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}`;

      if (!gradleConfig.includes('minifyEnabled true')) {
        gradleConfig = gradleConfig.replace(/android\s*{/g, optimizations);
        fs.writeFileSync(gradlePath, gradleConfig);
        this.log('✅ Gradle configuration optimized', 'success');
      } else {
        this.log('✅ Gradle already optimized', 'success');
      }
    } catch (error) {
      this.log(`❌ Failed to optimize Gradle: ${error.message}`, 'error');
    }
  }

  async configureNetworkSecurity() {
    this.log('🔒 Configuring network security...', 'info');
    
    const networkSecurityPath = path.join(__dirname, '../android/app/src/main/res/xml/network_security_config.xml');
    const networkSecurityDir = path.dirname(networkSecurityPath);
    
    if (!fs.existsSync(networkSecurityDir)) {
      fs.mkdirSync(networkSecurityDir, { recursive: true });
    }

    const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.ridesharapp.com</domain>
        <domain includeSubdomains="true">staging-api.ridesharapp.com</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
    
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
    
    <debug-overrides>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </debug-overrides>
</network-security-config>`;

    try {
      fs.writeFileSync(networkSecurityPath, networkSecurityConfig);
      this.log('✅ Network security configured', 'success');
    } catch (error) {
      this.log(`❌ Failed to configure network security: ${error.message}`, 'error');
    }
  }

  async configureDataExtraction() {
    this.log('📱 Configuring data extraction rules...', 'info');
    
    const dataExtractionPath = path.join(__dirname, '../android/app/src/main/res/xml/data_extraction_rules.xml');
    const dataExtractionDir = path.dirname(dataExtractionPath);
    
    if (!fs.existsSync(dataExtractionDir)) {
      fs.mkdirSync(dataExtractionDir, { recursive: true });
    }

    const dataExtractionConfig = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="file" path="."/>
        <exclude domain="file" path="sensitive_data/"/>
        <exclude domain="database" path="sensitive.db"/>
    </cloud-backup>
    
    <device-transfer>
        <include domain="file" path="."/>
        <exclude domain="file" path="sensitive_data/"/>
        <exclude domain="database" path="sensitive.db"/>
    </device-transfer>
</data-extraction-rules>`;

    try {
      fs.writeFileSync(dataExtractionPath, dataExtractionConfig);
      this.log('✅ Data extraction rules configured', 'success');
    } catch (error) {
      this.log(`❌ Failed to configure data extraction: ${error.message}`, 'error');
    }
  }

  async runFullOptimization() {
    this.log('🚀 Starting full Android optimization...', 'info');
    
    const optimizations = [
      this.optimizeImages(),
      this.optimizeBundle(),
      this.configureProGuard(),
      this.optimizeGradleConfig(),
      this.configureNetworkSecurity(),
      this.configureDataExtraction()
    ];

    try {
      await Promise.all(optimizations);
      this.log('✅ Full optimization completed successfully!', 'success');
    } catch (error) {
      this.log(`❌ Optimization failed: ${error.message}`, 'error');
    }
  }

  async generateOptimizationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      optimizationLog: this.optimizationLog,
      summary: {
        totalOptimizations: this.optimizationLog.filter(log => log.message.includes('✅')).length,
        warnings: this.optimizationLog.filter(log => log.message.includes('⚠️')).length,
        errors: this.optimizationLog.filter(log => log.message.includes('❌')).length
      }
    };

    const reportPath = `android-optimization-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 Optimization report saved to: ${reportPath}`, 'success');
    return reportPath;
  }
}

async function main() {
  const optimizer = new AndroidOptimizer();
  const args = process.argv.slice(2);
  const command = args[0];

  optimizer.log('🚗 Android Build Optimizer for Driver App', 'info');
  optimizer.log('==========================================', 'info');

  try {
    switch (command) {
      case 'images':
        await optimizer.optimizeImages();
        break;
        
      case 'bundle':
        await optimizer.optimizeBundle();
        break;
        
      case 'proguard':
        await optimizer.configureProGuard();
        break;
        
      case 'gradle':
        await optimizer.optimizeGradleConfig();
        break;
        
      case 'security':
        await optimizer.configureNetworkSecurity();
        break;
        
      case 'data':
        await optimizer.configureDataExtraction();
        break;
        
      case 'full':
        await optimizer.runFullOptimization();
        break;
        
      case 'report':
        await optimizer.generateOptimizationReport();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        optimizer.log('📖 Android Optimizer Usage:', 'info');
        optimizer.log('  node scripts/android-optimizer.js <command>', 'info');
        optimizer.log('', 'info');
        optimizer.log('Commands:', 'info');
        optimizer.log('  images    - Optimize image assets', 'info');
        optimizer.log('  bundle    - Optimize JavaScript bundle', 'info');
        optimizer.log('  proguard  - Configure ProGuard rules', 'info');
        optimizer.log('  gradle    - Optimize Gradle configuration', 'info');
        optimizer.log('  security  - Configure network security', 'info');
        optimizer.log('  data      - Configure data extraction rules', 'info');
        optimizer.log('  full      - Run all optimizations', 'info');
        optimizer.log('  report    - Generate optimization report', 'info');
        optimizer.log('  help      - Show this help', 'info');
        break;
        
      default:
        optimizer.log(`❌ Unknown command: ${command}`, 'error');
        optimizer.log('Run "node scripts/android-optimizer.js help" for usage', 'info');
        process.exit(1);
    }
  } catch (error) {
    optimizer.log(`❌ Optimization error: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AndroidOptimizer; 