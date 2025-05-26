// js/firebase-init.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuRG37e5qWu1kN7aZQVBwyQwj1EbIieHE",
    authDomain: "wcsharearideinitiativeproject.firebaseapp.com",
    projectId: "wcsharearideinitiativeproject",
    storageBucket: "wcsharearideinitiativeproject.firebasestorage.app",
    messagingSenderId: "169826993800",
    appId: "1:169826993800:web:367bee8597df79406b813d",
    measurementId: "G-7RJV9Q4NCT"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Use a default app ID if __app_id is not defined in your environment
// This is used for constructing Firestore paths
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let currentUserId = null; // To store the authenticated user's ID

/**
 * Authenticates with Firebase. Tries custom token first, then anonymous.
 * Sets the global currentUserId.
 * @returns {Promise<void>}
 */
async function authenticateFirebase() {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Signed in with custom token.");
        } else {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
        }
        currentUserId = auth.currentUser?.uid || crypto.randomUUID(); // Get UID or generate random for anonymous
        console.log("Current User ID:", currentUserId);
    } catch (error) {
        console.error("Firebase authentication error:", error);
        // You might want to pass this error back to the calling script to display a message
        throw error; // Re-throw to propagate the error
    }
}

/**
 * Returns the current authenticated user's ID.
 * @returns {string|null} The user ID or null if not authenticated.
 */
function getUserId() {
    return currentUserId;
}

// Export auth, db, appId, and the authentication function for use in other modules
export { auth, db, appId, authenticateFirebase, getUserId };
