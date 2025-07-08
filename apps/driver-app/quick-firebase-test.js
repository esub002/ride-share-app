// Quick Firebase Test Script
console.log('🧪 Quick Firebase OTP Test Starting...\n');

// Test 1: Check if React Native Firebase is available
console.log('🔧 Test 1: Checking React Native Firebase availability');
try {
  const auth = require('@react-native-firebase/auth');
  console.log('✅ @react-native-firebase/auth is available');
} catch (error) {
  console.error('❌ @react-native-firebase/auth is not available:', error.message);
  console.log('💡 Install with: npm install @react-native-firebase/auth');
}

// Test 2: Check if Firebase config is available
console.log('\n🔧 Test 2: Checking Firebase configuration');
try {
  const { firebaseAuth } = require('./firebaseConfig');
  if (firebaseAuth) {
    console.log('✅ Firebase Auth is available');
  } else {
    console.log('❌ Firebase Auth is not available');
  }
} catch (error) {
  console.error('❌ Firebase configuration error:', error.message);
}

// Test 3: Check if Auth Service is available
console.log('\n🔧 Test 3: Checking Auth Service');
try {
  const reactNativeFirebaseAuth = require('./utils/reactNativeFirebaseAuth');
  console.log('✅ React Native Firebase Auth service is available');
} catch (error) {
  console.error('❌ Auth Service error:', error.message);
}

// Test 4: Check dependencies
console.log('\n🔧 Test 4: Checking dependencies');
const dependencies = [
  '@react-native-firebase/app',
  '@react-native-firebase/auth',
  'react-native-phone-number-input'
];

dependencies.forEach(dep => {
  try {
    require(dep);
    console.log(`✅ ${dep} is available`);
  } catch (error) {
    console.error(`❌ ${dep} is missing`);
  }
});

console.log('\n📊 Test Summary:');
console.log('If you see any ❌ errors above, those need to be fixed.');
console.log('If all tests show ✅, your Firebase setup should be working.');
console.log('\n🚀 Next steps:');
console.log('1. Run: npm install @react-native-firebase/auth');
console.log('2. Add google-services.json to android/app/');
console.log('3. Clean and rebuild: npx expo run:android');
console.log('4. Test with a real phone number'); 