// js/login-form.js

// Import Firebase instances and authentication function from firebase-init.js
import { auth, db, appId, getUserId } from './firebase-init.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// DOM element references
const messageBox = document.getElementById('message-box');
// Updated to get all icon elements
const successIcon = messageBox ? messageBox.querySelector('.icon-success') : null;
const errorIcon = messageBox ? messageBox.querySelector('.icon-error') : null;
const infoIcon = messageBox ? messageBox.querySelector('.icon-info') : null;
const messageContent = messageBox ? messageBox.querySelector('.message-content') : null;

// Debugging logs for DOM elements (These are helpful for initial setup but can be removed later)
if (!messageBox) console.error("Error: #message-box not found!");
if (messageBox && !successIcon) console.error("Error: .icon-success not found inside #message-box!");
if (messageBox && !errorIcon) console.error("Error: .icon-error not found inside #message-box!");
if (messageBox && !infoIcon) console.error("Error: .icon-info not found inside #message-box!");
if (messageBox && !messageContent) console.error("Error: .message-content not found inside #message-box!");


const loginForm = document.getElementById('login-form');
const mainContentContainer = document.getElementById('main-content-container'); // Assuming you have this on login page too
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
 * @param {boolean} stayVisible - If true, the message will not auto-hide after a timeout.
 */
function showMessage(message, type = 'success', isHtml = false, stayVisible = false) {
    if (!messageBox) {
        console.error("showMessage: #message-box element is missing. Cannot display message.");
        return;
    }

    // Clear previous classes and content
    messageBox.classList.remove('show', 'success', 'error', 'info');
    if (messageContent) messageContent.innerHTML = ''; // Clear content div

    // DRY: Create a map of types to icons for dynamic display
    const iconMap = {
        'success': successIcon,
        'error': errorIcon,
        'info': infoIcon
    };

    // DRY: Hide all icons first using the map
    Object.values(iconMap).forEach(icon => {
        if (icon) icon.style.display = 'none';
    });

    if (type === 'clear') {
        messageBox.style.display = 'none';
        if (mainContentContainer) {
            mainContentContainer.classList.remove('hide-main-content');
            console.log("CLEAR: mainContentContainer shown.");
        }
        // Re-enable form fields if cleared manually
        loginForm.querySelectorAll('input, select').forEach(element => {
            element.disabled = false;
        });
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
        loginButton.classList.remove('opacity-75', 'cursor-not-allowed');
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

    // Hide main content container if message should cover it
    if (mainContentContainer) {
        mainContentContainer.classList.add('hide-main-content');
        console.log(`MESSAGE (${type}): mainContentContainer hidden.`);
    }

    // Disable form fields when message is displayed
    loginForm.querySelectorAll('input, select').forEach(element => {
        element.disabled = true;
    });
    loginButton.disabled = true;


    // Set timeout to hide the message, unless stayVisible is true
    if (!stayVisible) {
        const displayDuration = (type === 'success' && isHtml) ? 8000 : 5000; // 8 seconds for detailed success, 5 for others
        setTimeout(() => {
            // Only hide if the current message type is still active
            if (messageBox.classList.contains(type)) {
                messageBox.classList.remove('show', type);
                if (messageContent) messageContent.innerHTML = '';
                Object.values(iconMap).forEach(icon => {
                    if (icon) icon.style.display = 'none';
                });
                messageBox.style.display = 'none';
                if (mainContentContainer) {
                    mainContentContainer.classList.remove('hide-main-content');
                    console.log(`MESSAGE (${type}): mainContentContainer reshown.`);
                }
                // Re-enable form fields
                loginForm.querySelectorAll('input, select').forEach(element => {
                    element.disabled = false;
                });
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
                loginButton.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        }, displayDuration);
    }
}


/**
 * Handles the click event for the generic message's close button.
 * This function will hide the message, re-enable the form, and sign out the user if they were logged in.
 */
async function handleGenericMessageClose() {
    showMessage('', 'clear'); // Use the clear functionality to hide and re-enable form
    // Sign out the user when they close the unverified email message
    if (auth.currentUser) {
        await signOut(auth);
        console.log("User signed out after closing message.");
    }
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

    // Disable all form fields (excluding the button initially)
    loginForm.querySelectorAll('input, select').forEach(element => {
        element.disabled = true;
    });

    // Update and disable the login button
    loginButton.disabled = true;
    loginButton.textContent = buttonText;
    loginButton.classList.add('opacity-75', 'cursor-not-allowed'); // Add Tailwind classes for visual feedback
}

/**
 * Hides the loading overlay. Also resets the login button text, but keeps it disabled.
 */
function hideLoading() {
    loadingOverlay.classList.remove('visible');
    // IMPORTANT: Form fields are NOT re-enabled here. They remain disabled until handleSuccessClose() is called or an error occurs.
    // This ensures the form stays blocked while the message is displayed.
    loginButton.textContent = 'Login'; // Restore original text
    loginButton.classList.remove('opacity-75', 'cursor-not-allowed'); // Remove loading classes
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

            // --- DEBUGGING LOGS ADDED HERE ---
            console.log("User object after successful sign-in:", user);
            console.log("Is email verified from user object (before check)?", user.emailVerified);
            // --- END DEBUGGING LOGS ---

            // --- CRITICAL FIX: Explicitly check email verification status immediately and return ---
            if (!user.emailVerified) {
                console.log("Email is NOT verified after successful sign-in. Displaying specific message.");
                const unverifiedHtmlMessage = `
                    <strong>Email Not Verified</strong>
                    <p style="margin-top: 1rem; margin-bottom: 0.5rem; font-weight: normal;">
                        Your email address (<strong>${email}</strong>) has not been verified.
                        Please check your inbox (and spam folder) for a verification email.
                    </p>
                    <button id="resend-verification-button" class="message-box-button">
                        Resend Verification Email
                    </button>
                    <button id="close-unverified-message-button" class="message-box-button" style="background-image: linear-gradient(to right, #6b7280, #4b5563); margin-left: 1rem;">
                        Close
                    </button>
                `;
                // Changed type from 'info' to 'error' for red styling
                showMessage(unverifiedHtmlMessage, 'error', true, true); // Stay visible

                // Add event listener for resend button
                const resendButton = messageBox.querySelector('#resend-verification-button');
                if (resendButton) {
                    resendButton.onclick = async () => {
                        resendButton.disabled = true;
                        resendButton.textContent = 'Sending...';
                        try {
                            // auth.currentUser should be valid here because we are not signing out immediately
                            if (auth.currentUser) {
                                await sendEmailVerification(auth.currentUser);
                                showMessage('Verification email resent! Please check your inbox.', 'success', false, false); // Auto-hide
                            } else {
                                console.error("No current user to resend verification email to. User might have been signed out unexpectedly.");
                                showMessage('Failed to resend verification email. Please try logging in again.', 'error', false, false);
                            }
                        } catch (resendError) {
                            console.error("Error resending verification email:", resendError);
                            showMessage(`Failed to resend email: ${resendError.message}`, 'error', false, false); // Auto-hide
                        } finally {
                            resendButton.disabled = false;
                            resendButton.textContent = 'Resend Verification Email';
                        }
                    };
                }

                // Add event listener for close button
                const closeUnverifiedButton = messageBox.querySelector('#close-unverified-message-button');
                if (closeUnverifiedButton) {
                    closeUnverifiedButton.onclick = handleGenericMessageClose; // Reuse generic close, which now handles sign out
                }

                hideLoading(); // Hide loading as message is now displayed
                return; // *** STOP EXECUTION HERE ***
            }
            // --- END CRITICAL FIX ---


            // Fetch user profile to check status (only if email is verified)
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
                    // Specific message for pending approval
                    showMessage(`Your account status is currently pending approval. Please wait for an administrator to review your application.`, 'info', false);
                    await signOut(auth); // Sign out user if account is pending
                } else if (userData.status === 'rejected') {
                    showMessage(`Your account has been rejected. Please contact support for more information.`, 'error', false);
                    await signOut(auth); // Sign out user if account is rejected
                } else {
                    showMessage(`Your account status is unknown. Please contact support.`, 'error', false);
                    await signOut(auth); // Sign out user for unknown status
                }
            } else {
                // User profile not found (shouldn't happen if signup worked, but good to handle)
                showMessage('User profile not found. Please contact support.', 'error', false);
                await signOut(auth); // Sign out user
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
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
                formErrorResponse('email-error', errorMessage); // General error for security
                formErrorResponse('password-error', 'Invalid email or password.');
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            }
            // The 'auth/email-not-verified' is now handled explicitly in the try block, so no need for this
            // else if (error.code === 'auth/email-not-verified') { ... }
            else if (error.message) {
                errorMessage = error.message;
            }

            // For general errors not handled by specific code, display in the message box
            showMessage(`Login failed: ${errorMessage}`, 'error', false, false); // Auto-hide for general errors
            hideLoading(); // Hide loading for all errors
        }
    }
});

// Forgot Password Link
forgotPasswordLink.addEventListener('click', async (event) => {
    event.preventDefault();
    clearAllFormErrors();
    showMessage('', 'clear'); // Clear any message box

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
        showMessage(`Password reset email sent to ${email}. Please check your inbox.`, 'success', false, false);
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
        showMessage(`Password reset failed: ${errorMessage}`, 'error', false, false);
    } finally {
        hideLoading();
    }
});


// Switch to Sign Up Page
signupLink.addEventListener('click', (event) => {
    event.preventDefault();
    showMessage('Redirecting to Sign Up Page...', 'info', false, false); // Auto-hide
    window.location.href = 'usersignupform.html';
});
