// firebase-config.js - Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyAC3xaSFXMBH4Q5_3t_8ahitDqLKhBWOQA",
  authDomain: "classicauction.firebaseapp.com",
  projectId: "classicauction",
  storageBucket: "classicauction.firebasestorage.app",
  messagingSenderId: "621471898709",
  appId: "1:621471898709:web:ea94de1b232bb7c82f48dc",
  measurementId: "G-LVZ75CWDE9"
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