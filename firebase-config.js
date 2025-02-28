// Firebase configuration - replace with your own config values
const firebaseConfig = {
    apiKey: "AIzaSyCr75hDKyYhREXFcaBeTaiV7xhoJIt0a1g",
    authDomain: "viamyva-4381d.firebaseapp.com",
    projectId: "viamyva-4381d",
    storageBucket: "viamyva-4381d.firebasestorage.app",
    messagingSenderId: "226251093666",
    appId: "1:226251093666:web:630bc51bce12dc3e2149fb",
    measurementId: "G-W9NCN46V96"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Create a Firestore instance
const db = firebase.firestore();