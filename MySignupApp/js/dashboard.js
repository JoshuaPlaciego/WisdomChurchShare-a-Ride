// js/dashboard.js

// Import Firebase authentication
import { auth } from './firebase-init.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// DOM element references
const logoutButton = document.getElementById('logout-button');

// Check if the logout button exists
if (logoutButton) {
    // Add event listener for the logout button
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth); // Sign out the user from Firebase
            console.log("User successfully logged out.");
            // Redirect to the login page after successful logout
            window.location.href = 'userloginform.html';
        } catch (error) {
            console.error("Error signing out:", error);
            // Optionally, display an error message to the user
            alert("Failed to log out. Please try again."); // Using alert for simplicity, consider a custom message box
        }
    });
} else {
    console.error("Error: #logout-button not found in dashboard.html.");
}
