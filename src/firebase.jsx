// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";  // Import Firebase Storage

const firebaseConfig = {
    apiKey: "AIzaSyAscrd1ZTilHy0-575kSP8cNjOPp0ypObE",
    authDomain: "debatemate-69427.firebaseapp.com",
    projectId: "debatemate-69427",
    storageBucket: "debatemate-69427.appspot.com",
    messagingSenderId: "524111850175",
    appId: "1:524111850175:web:b9f19508f54735b92e740a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);  // Initialize Firebase Storage

export { firestore, auth, storage };  // Export Storage
