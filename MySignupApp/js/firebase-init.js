// js/firebase-init.js

// Firebase App (the core library)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// Firebase Authentication
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Firebase Firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuRG37e5qWu1kN7aZQVBwyQwj1EbIieHE",
  authDomain: "wcsharearideinitiativeproject.firebaseapp.com",
  databaseURL: "https://wcsharearideinitiativeproject-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wcsharearideinitiativeproject",
  storageBucket: "wcsharearideinitiativeproject.firebasestorage.app",
  messagingSenderId: "169826993800",
  appId: "1:169826993800:web:367bee8597df79406b813d",
  measurementId: "G-7RJV9Q4NCT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get the app ID from the global variable (provided by Canvas environment)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let currentUserId = null; // To store the current user's UID

// Function to get the current user ID, handling anonymous sign-in if no custom token
async function getUserId() {
    return new Promise(resolve => {
        // onAuthStateChanged ensures Firebase auth state is ready
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in.
                currentUserId = user.uid;
                console.log("Firebase: User is signed in with UID:", currentUserId);
                unsubscribe(); // Stop listening after the first state change
                resolve(currentUserId);
            } else {
                // User is signed out or not yet signed in.
                console.log("Firebase: No user signed in. Attempting anonymous sign-in.");
                try {
                    // Sign in anonymously if no user is found
                    await signInAnonymously(auth);
                    // onAuthStateChanged will trigger again with the anonymous user
                } catch (error) {
                    console.error("Firebase: Anonymous sign-in failed:", error);
                    // If anonymous sign-in fails, generate a random ID as a fallback
                    currentUserId = crypto.randomUUID();
                    console.log("Firebase: Falling back to random UUID for userId:", currentUserId);
                    unsubscribe(); // Stop listening
                    resolve(currentUserId);
                }
            }
        });

        // If __initial_auth_token is provided, attempt custom token sign-in first
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            console.log("Firebase: Custom auth token found. Attempting sign-in with custom token.");
            signInWithCustomToken(auth, __initial_auth_token)
                .then((userCredential) => {
                    // Signed in successfully, onAuthStateChanged will handle the user
                    console.log("Firebase: Signed in with custom token.");
                })
                .catch((error) => {
                    console.error("Firebase: Custom token sign-in failed:", error);
                    // Fallback to anonymous or existing onAuthStateChanged logic
                });
        }
    });
}

// Export Firebase instances and the getUserId function
export { auth, db, appId, getUserId };

// Immediately call getUserId to ensure authentication state is handled on load
getUserId();
