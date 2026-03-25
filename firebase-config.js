// firebase-config.js - Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyA-CAlLZJNrTvhGDY-0u82ba0ocba4UO44",
  authDomain: "druktesting-a1ff1.firebaseapp.com",
  projectId: "druktesting-a1ff1",
  storageBucket: "druktesting-a1ff1.firebasestorage.app",
  messagingSenderId: "240678806946",
  appId: "1:240678806946:web:b621c0eba20979b56cfefb",
  measurementId: "G-37RVXDHWPN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log('Firebase initialized with config:', firebaseConfig);

// Initialize Firebase Auth
const auth = firebase.auth();
console.log('Firebase Auth initialized');

// Initialize Analytics (optional)
const analytics = firebase.analytics();
console.log('Firebase Analytics initialized');