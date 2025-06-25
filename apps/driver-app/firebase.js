// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFYrgJcpIdKjNnMc1zJyOxWPAIjivZttg",
  authDomain: "ride-82.firebaseapp.com",
  projectId: "ride-82",
  storageBucket: "ride-82.firebasestorage.app",
  messagingSenderId: "799196884863",
  appId: "1:799196884863:web:1811c8ed525f77721db44a",
  measurementId: "G-YZSTT7TV3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);