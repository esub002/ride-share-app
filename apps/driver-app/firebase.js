// React Native Firebase native SDK setup
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';
// import analytics from '@react-native-firebase/analytics'; // Uncomment if using analytics

// No need to call initializeApp! The native SDK auto-initializes using google-services.json / GoogleService-Info.plist

export { auth, firestore, storage, messaging /*, analytics */ };