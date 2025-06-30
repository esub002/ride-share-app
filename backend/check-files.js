/**
 * Backend File Checker
 * Validates all backend files for syntax errors and basic structure
 * No external dependencies required - uses only Node.js built-ins
 */

const fs = require('fs');
const path = require('path');

// Files to check
const filesToCheck = [
  // Main server files
  'server.js',
  'start-dev.js',
  
  // Test files
  'test-simple.js',
  'test-server-basic.js',
  'test-socket-client.js',
  'test-runner.js',
  
  // Configuration files
  'package.json',
  'jest.config.js',
  'jest.setup.js',
  
  // Service files
  'services/socketService.js',
  
  // Middleware files
  'middleware/auth.js',
  'middleware/security.js',
  'middleware/database.js',
  
  // Route files
  'routes/user.js',
  'routes/driver.js',
  'routes/ride.js',
  'routes/authUser.js',
  'routes/authDriver.js',
  'routes/admin.js',
  'routes/analytics.js',
  'routes/safety.js'
];

// Directories to check
const directoriesToCheck = [
  'middleware',
  'routes',
  'services',
  'utils',
  'config',
  'scripts',
  '__tests__',
  'tests'
];

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function checkFileSyntax(filePath) {
  try {
    // Try to require the file to check for syntax errors
    require(filePath);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function checkJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function checkDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return { exists: false, files: [] };
    }
    
    const files = fs.readdirSync(dirPath);
    return { exists: true, files };
  } catch (error) {
    return { exists: false, files: [], error: error.message };
  }
}

function analyzeFile(filePath) {
  console.log(`🔍 Checking: ${filePath}`);
  
  if (!checkFileExists(filePath)) {
    console.log(`  ❌ File not found: ${filePath}`);
    return false;
  }
  
  const ext = path.extname(filePath);
  
  if (ext === '.json') {
    const result = checkJsonFile(filePath);
    if (result.valid) {
      console.log(`  ✅ ${filePath} - Valid JSON`);
      return true;
    } else {
      console.log(`  ❌ ${filePath} - JSON Error: ${result.error}`);
      return false;
    }
  } else if (ext === '.js') {
    const result = checkFileSyntax(filePath);
    if (result.valid) {
      console.log(`  ✅ ${filePath} - Valid JavaScript`);
      return true;
    } else {
      console.log(`  ❌ ${filePath} - Syntax Error: ${result.error}`);
      return false;
    }
  } else {
    console.log(`  ⚠️ ${filePath} - Unknown file type`);
    return true;
  }
}

function analyzeDirectory(dirPath) {
  console.log(`📁 Checking directory: ${dirPath}`);
  
  const result = checkDirectory(dirPath);
  
  if (!result.exists) {
    console.log(`  ❌ Directory not found: ${dirPath}`);
    return false;
  }
  
  console.log(`  ✅ Directory exists with ${result.files.length} files`);
  
  if (result.files.length > 0) {
    console.log(`  📄 Files: ${result.files.slice(0, 5).join(', ')}${result.files.length > 5 ? '...' : ''}`);
  }
  
  return true;
}

function checkPackageJson() {
  console.log('\n📦 Checking package.json...');
  
  const packagePath = 'package.json';
  if (!checkFileExists(packagePath)) {
    console.log('  ❌ package.json not found');
    return false;
  }
  
  const result = checkJsonFile(packagePath);
  if (!result.valid) {
    console.log(`  ❌ package.json - Invalid JSON: ${result.error}`);
    return false;
  }
  
  try {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log('  ✅ package.json - Valid JSON');
    console.log(`  📝 Name: ${packageContent.name}`);
    console.log(`  📝 Version: ${packageContent.version}`);
    console.log(`  📝 Main: ${packageContent.main}`);
    
    // Check for required scripts
    const requiredScripts = ['start', 'test', 'test:simple', 'test:realtime'];
    const missingScripts = requiredScripts.filter(script => !packageContent.scripts[script]);
    
    if (missingScripts.length === 0) {
      console.log('  ✅ All required scripts found');
    } else {
      console.log(`  ⚠️ Missing scripts: ${missingScripts.join(', ')}`);
    }
    
    // Check dependencies
    if (packageContent.dependencies) {
      console.log(`  📦 Dependencies: ${Object.keys(packageContent.dependencies).length}`);
    }
    
    if (packageContent.devDependencies) {
      console.log(`  🔧 Dev Dependencies: ${Object.keys(packageContent.devDependencies).length}`);
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

function checkNodeModules() {
  console.log('\n📦 Checking node_modules...');
  
  const nodeModulesPath = 'node_modules';
  const result = checkDirectory(nodeModulesPath);
  
  if (!result.exists) {
    console.log('  ❌ node_modules not found - run "npm install" when Node.js is available');
    return false;
  }
  
  console.log(`  ✅ node_modules exists with ${result.files.length} packages`);
  return true;
}

function main() {
  console.log('🚀 Backend File Validation');
  console.log('='.repeat(50));
  console.log('📅 Started at:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('='.repeat(50));
  
  let totalFiles = 0;
  let validFiles = 0;
  let totalDirs = 0;
  let validDirs = 0;
  
  // Check package.json first
  if (checkPackageJson()) {
    validFiles++;
  }
  totalFiles++;
  
  // Check node_modules
  checkNodeModules();
  
  // Check directories
  console.log('\n📁 Checking directories...');
  directoriesToCheck.forEach(dir => {
    if (analyzeDirectory(dir)) {
      validDirs++;
    }
    totalDirs++;
  });
  
  // Check individual files
  console.log('\n📄 Checking files...');
  filesToCheck.forEach(file => {
    if (analyzeFile(file)) {
      validFiles++;
    }
    totalFiles++;
  });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`📁 Directories: ${validDirs}/${totalDirs} valid`);
  console.log(`📄 Files: ${validFiles}/${totalFiles} valid`);
  
  if (validFiles === totalFiles && validDirs === totalDirs) {
    console.log('\n🎉 All files validated successfully!');
    console.log('✅ No syntax errors found');
    console.log('✅ All required files exist');
    console.log('✅ Directory structure is correct');
    console.log('\n💡 Next steps:');
    console.log('1. Install Node.js from https://nodejs.org/');
    console.log('2. Run: npm install');
    console.log('3. Run: npm start');
    console.log('4. Run: npm run test:realtime');
  } else {
    console.log('\n⚠️ Some issues found:');
    console.log('🔧 Please fix the errors above before proceeding');
    console.log('💡 Make sure all required files are present');
  }
  
  console.log('\n' + '='.repeat(50));
}

// Run validation if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeFile,
  analyzeDirectory,
  checkPackageJson,
  main
}; 