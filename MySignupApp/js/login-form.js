// js/login-form.js

// Import Firebase instances and authentication function from firebase-init.js
import { auth, db, appId, getUserId } from './firebase-init.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// DOM element references
const messageBox = document.getElementById('message-box');
const messageIcon = messageBox ? messageBox.querySelector('.message-icon') : null;
const messageContent = messageBox ? messageBox.querySelector('.message-content') : null;

// Debugging logs for DOM elements
if (!messageBox) console.error("Error: #message-box not found!");
if (messageBox && !messageIcon) console.error("Error: .message-icon not found inside #message-box!");
if (messageBox && !messageContent) console.error("Error: .message-content not found inside #message-box!");


const loginForm = document.getElementById('login-form');
const signupLink = document.getElementById('signup-link');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.getElementById('toggle-password');
const loginButton = document.getElementById('login-button');

// References for loading UI
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');


/**
 * Displays a message in the message box.
 * @param {string} message - The message to display (can be plain text or HTML).
 * @param {string} type - The type of message ('success', 'error', 'info', 'clear').
 * @param {boolean} isHtml - True if the message is HTML, false for plain text.
 */
function showMessage(message, type = 'success', isHtml = false) {
    if (!messageBox) {
        console.error("showMessage: #message-box element is missing. Cannot display message.");
        return;
    }

    // Clear previous classes and content
    messageBox.classList.remove('show', 'success', 'error', 'info');
    if (messageContent) messageContent.innerHTML = ''; // Clear content div

    // DRY: Create a map of types to icons for dynamic display
    const iconMap = {
        'success': messageBox.querySelector('.icon-success'),
        'error': messageBox.querySelector('.icon-error'),
        'info': messageBox.querySelector('.icon-info')
    };

    // DRY: Hide all icons first using the map
    Object.values(iconMap).forEach(icon => {
        if (icon) icon.style.display = 'none';
    });

    if (type === 'clear') {
        messageBox.style.display = 'none';
        return;
    }

    // Set message content
    if (isHtml) {
        if (messageContent) messageContent.innerHTML = message;
    } else {
        if (messageContent) messageContent.textContent = message;
    }

    // Apply type-specific classes
    messageBox.classList.add('show', type);
    messageBox.style.display = 'flex'; // Make message box visible

    // DRY: Show the appropriate icon based on type using the map
    if (iconMap[type]) {
        iconMap[type].style.display = 'block';
    }

    // Set timeout to hide the message
    const displayDuration = (type === 'success' && isHtml) ? 8000 : 5000; // 8 seconds for detailed success, 5 for others
    setTimeout(() => {
        if (messageBox.classList.contains(type)) { // Only hide if it's still the active message
            messageBox.classList.remove('show');
            messageBox.classList.remove(type);
            if (messageContent) messageContent.innerHTML = '';
            // DRY: Hide all icons when message box is cleared using the map
            Object.values(iconMap).forEach(icon => {
                if (icon) icon.style.display = 'none';
            });
            messageBox.style.display = 'none';
        }
    }, displayDuration);
}

/**
 * Displays a validation error message for a specific input field.
 * @param {string} inputID - The ID of the error div (e.g., 'email-error').
 * @param {string} response - The error message.
 */
function formErrorResponse(inputID, response) {
    const error = document.getElementById(inputID);
    if (error) {
        error.style.display = 'block';
        error.textContent = response;
    } else {
        console.warn(`Error element with ID '${inputID}' not found.`);
    }
}

/**
 * Clears all displayed error messages from the form.
 */
function clearAllFormErrors() {
    document.querySelectorAll('.text-red-500').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

// --- Loading UI Functions ---
/**
 * Shows the loading overlay, disables the form, and updates the button text.
 * @param {string} message - Message for the central loading UI.
 * @param {string} buttonText - Text to display on the submit button during loading.
 */
function showLoading(message = 'Please wait...', buttonText = 'Logging you in. Please wait...') {
    loadingMessage.textContent = message;
    loadingOverlay.classList.add('visible');

    loginForm.querySelectorAll('input, select').forEach(element => {
        element.disabled = true;
    });

    loginButton.disabled = true;
    loginButton.textContent = buttonText;
    loginButton.classList.add('opacity-75', 'cursor-not-allowed');
}

/**
 * Hides the loading overlay, re-enables the form, and restores the button text.
 */
function hideLoading() {
    loadingOverlay.classList.remove('visible');

    loginForm.querySelectorAll('input, select').forEach(element => {
        element.disabled = false;
    });

    loginButton.disabled = false;
    loginButton.textContent = 'Login';
    loginButton.classList.remove('opacity-75', 'cursor-not-allowed');
}


// --- Event Listeners ---

// Toggle password visibility
togglePasswordButton.addEventListener('mousedown', () => {
    passwordInput.setAttribute('type', 'text');
    togglePasswordButton.textContent = 'Hide';
});
togglePasswordButton.addEventListener('mouseup', () => {
    passwordInput.setAttribute('type', 'password');
    togglePasswordButton.textContent = 'Show';
});
togglePasswordButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    passwordInput.setAttribute('type', 'text');
    togglePasswordButton.textContent = 'Hide';
});
togglePasswordButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    passwordInput.setAttribute('type', 'password');
    togglePasswordButton.textContent = 'Show';
});


// Form submission handler
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    let isValid = true;

    clearAllFormErrors(); // Clear all previous errors
    showMessage('', 'clear'); // Clear any previous general messages

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Client-side validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        formErrorResponse('email-error', 'Email is required');
        isValid = false;
    } else if (!emailPattern.test(email)) {
        formErrorResponse('email-error', 'Please enter a valid email address.');
        isValid = false;
    }

    if (!password) {
        formErrorResponse('password-error', 'Password is required');
        isValid = false;
    }

    if (isValid) {
        showLoading('Logging you in, please wait...');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userId = user.uid;

            // Fetch user profile to check status
            const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userId}/user_profiles`, 'profile_data');
            const docSnap = await getDoc(userProfileDocRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.status === 'approved') {
                    // Successful login and approved status
                    showMessage(`Welcome back, ${userData.firstName}!`, 'success', false);
                    // Redirect to a dashboard or main app page
                    setTimeout(() => {
                        window.location.href = 'dashboard.html'; // Replace with your actual dashboard page
                    }, 2000); // Short delay before redirecting
                } else if (userData.status === 'pending') {
                    showMessage(`Your account is pending approval. Please check your email for verification and wait for administrative review.`, 'info', false);
                    await auth.signOut(); // Sign out user if account is pending
                } else if (userData.status === 'rejected') {
                    showMessage(`Your account has been rejected. Please contact support for more information.`, 'error', false);
                    await auth.signOut(); // Sign out user if account is rejected
                } else {
                    showMessage(`Your account status is unknown. Please contact support.`, 'error', false);
                    await auth.signOut(); // Sign out user for unknown status
                }
            } else {
                // User profile not found (shouldn't happen if signup worked, but good to handle)
                showMessage('User profile not found. Please contact support.', 'error', false);
                await auth.signOut(); // Sign out user
            }

            hideLoading();

        } catch (error) {
            console.error("Error during login:", error);
            let errorMessage = "An unknown error occurred during login.";
            if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
                formErrorResponse('email-error', errorMessage);
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'Your account has been disabled.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password.';
                formErrorResponse('email-error', errorMessage); // General error for security
                formErrorResponse('password-error', 'Invalid email or password.');
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(`Login failed: ${errorMessage}`, 'error', false);
            hideLoading();
        }
    }
});

// Forgot Password Link
forgotPasswordLink.addEventListener('click', async (event) => {
    event.preventDefault();
    clearAllFormErrors();
    showMessage('', 'clear');

    const email = emailInput.value.trim();
    if (!email) {
        formErrorResponse('email-error', 'Please enter your email to reset password.');
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        formErrorResponse('email-error', 'Please enter a valid email address.');
        return;
    }

    showLoading('Sending password reset email...', 'Sending...');
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage(`Password reset email sent to ${email}. Please check your inbox.`, 'success', false);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        let errorMessage = "Failed to send password reset email.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No user found with that email address.';
            formErrorResponse('email-error', errorMessage);
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
            formErrorResponse('email-error', errorMessage);
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        showMessage(`Password reset failed: ${errorMessage}`, 'error', false);
    } finally {
        hideLoading();
    }
});


// Switch to Sign Up Page
signupLink.addEventListener('click', (event) => {
    event.preventDefault();
    showMessage('Redirecting to Sign Up Page...', 'info', false);
    window.location.href = 'usersignupform.html';
});
