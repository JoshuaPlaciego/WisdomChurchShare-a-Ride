// js/signup-form.js

// Import Firebase instances and authentication function from firebase-init.js
import { auth, db, appId, getUserId } from './firebase-init.js';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// DOM element references
const messageBox = document.getElementById('message-box');
const messageIcon = messageBox ? messageBox.querySelector('.message-icon') : null;
const messageContent = messageBox ? messageBox.querySelector('.message-content') : null;

// Debugging logs for DOM elements (These are helpful for initial setup but can be removed later)
if (!messageBox) console.error("Error: #message-box not found!");
if (messageBox && !messageIcon) console.error("Error: .message-icon not found inside #message-box!");
if (messageBox && !messageContent) console.error("Error: .message-content not found inside #message-box!");


const signupForm = document.getElementById('signup-form');
// NEW DEBUGGING LOG: Check if signupForm is found
if (!signupForm) console.error("Error: #signup-form not found!");


const loginLink = document.getElementById('login-link');
const firstNameInput = document.getElementById('first_name');
const lastNameInput = document.getElementById('last_name');
const genderInput = document.getElementById('gender');
const cityInput = document.getElementById('city');
const facebookLinkInput = document.getElementById('facebook_link');
const emailInput = document.getElementById('email');
const mobileNumberInput = document.getElementById('mobile_number');
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.getElementById('toggle-password');
const signupButton = document.getElementById('signup-button'); // Reference to the signup button

// Password strength checker elements
const passwordLengthCheck = document.getElementById('password-length-check');
const passwordCapitalCheck = document.getElementById('password-capital-check');
const passwordSymbolCheck = document.getElementById('password-symbol-check');
const passwordNumberCheck = document.getElementById('password-number-check');

// References for loading UI
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');


/**
 * Displays a message in the message box.
 * @param {string} message - The message to display (can be plain text or HTML for success).
 * @param {string} type - The type of message ('success', 'error', 'info', 'clear').
 * @param {boolean} isHtml - True if the message is HTML, false for plain text.
 */
function showMessage(message, type = 'success', isHtml = false) {
    // Ensure messageBox exists before proceeding
    if (!messageBox) {
        console.error("showMessage: #message-box element is missing. Cannot display message.");
        return;
    }

    // Clear previous classes and content
    messageBox.classList.remove('show', 'success', 'error', 'info');

    // Defensive checks for messageIcon and messageContent
    if (messageIcon) messageIcon.style.display = 'none'; // Hide icon by default
    if (messageContent) messageContent.innerHTML = ''; // Clear content div

    if (type === 'clear') {
        // When clearing, only hide the message box.
        messageBox.style.display = 'none';
        // IMPORTANT: When clearing a success message, we are about to redirect, so no need to show form.
        // If it's an error/info message being cleared, the form should already be visible.
        return;
    }

    // Set message content
    if (isHtml) {
        if (messageContent) messageContent.innerHTML = message;
        if (messageIcon) messageIcon.style.display = 'block'; // Show icon for HTML (success) messages
    } else {
        if (messageContent) messageContent.textContent = message;
        if (messageIcon) messageIcon.style.display = 'none'; // Hide icon for plain text messages
    }

    // Apply type-specific classes
    messageBox.classList.add('show', type);
    messageBox.style.display = 'flex'; // IMPORTANT: Make message box visible

    // Add event listener for the Close button if it's a success message
    if (type === 'success' && isHtml) {
        // IMPORTANT: Hide the signup form when the success message appears
        if (signupForm) { // Ensure signupForm is found before trying to hide it
            signupForm.style.display = 'none';
            console.log("Signup form hidden."); // Debugging log
        }


        const closeButton = messageBox.querySelector('#close-success-message-button');
        if (closeButton) {
            // Remove any existing listeners to prevent duplicates
            closeButton.removeEventListener('click', handleSuccessClose);
            closeButton.addEventListener('click', handleSuccessClose);
        }
        // Success message now relies on the close button, so keep it visible indefinitely
        // No setTimeout to hide automatically for success HTML messages
    } else {
        // For other message types (error/info), hide automatically after 5 seconds
        setTimeout(() => {
            if (messageBox.classList.contains(type)) { // Only hide if it's still the active message
                messageBox.classList.remove('show');
                messageBox.classList.remove(type);
                if (messageContent) messageContent.innerHTML = '';
                if (messageIcon) messageIcon.style.display = 'none';
                messageBox.style.display = 'none'; // Hide message box after timeout
                // If an error/info message, ensure the form is visible again
                if (signupForm) {
                    signupForm.style.display = 'block';
                    // Also re-enable form fields and button for error/info messages
                    signupForm.querySelectorAll('input, select').forEach(element => {
                        element.disabled = false;
                    });
                    signupButton.disabled = false;
                    signupButton.textContent = 'Sign Up';
                    signupButton.classList.remove('opacity-75', 'cursor-not-allowed');
                }
            }
        }, 5000); // 5 seconds for error/info messages
    }
}

/**
 * Handles the click event for the success message's close button.
 * This function will hide the message and redirect to login.
 * The form's visibility and button state are not reset here, as we are immediately redirecting.
 */
function handleSuccessClose() {
    // Hide the success message
    showMessage('', 'clear'); // This will now only hide the message box.

    // No need to re-enable form fields or button state here, as we are immediately redirecting.
    // The target page (userloginform.html) will handle its own initial state.

    // Redirect to the login page immediately
    window.location.href = 'userloginform.html';
}


/**
 * Displays a validation error message for a specific input field.
 * @param {string} inputID - The ID of the error div (e.g., 'email-error').
 * @param {string} response - The error message.
 */
function formErrorResponse(inputID, response) {
    const error = document.getElementById(inputID);
    if (error) { // Ensure the error element exists
        error.style.display = 'block';
        error.textContent = response;
    } else {
        console.warn(`Error element with ID '${inputID}' not found.`);
    }
}

/**
 * Updates the visual indicators for password strength based on the input value.
 */
function updatePasswordStrength() {
    const password = passwordInput.value;

    // Helper to update check status
    const updateCheck = (element, condition) => {
        if (element) { // Ensure element exists before manipulating classes
            if (condition) {
                element.classList.remove('text-red-500');
                element.classList.add('text-green-600');
            } else {
                element.classList.remove('text-green-600');
                element.classList.add('text-red-500');
            }
        }
    };

    updateCheck(passwordLengthCheck, password.length >= 6 && password.length <= 20);
    updateCheck(passwordCapitalCheck, /[A-Z]/.test(password));
    updateCheck(passwordSymbolCheck, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
    updateCheck(passwordNumberCheck, /\d/.test(password));
}

// --- Loading UI Functions ---
/**
 * Shows the loading overlay, disables the form, and updates the button text.
 * @param {string} message - Message for the central loading UI.
 * @param {string} buttonText - Text to display on the submit button during loading.
 */
function showLoading(message = 'Please wait...', buttonText = 'Signing you up. Please wait...') {
    loadingMessage.textContent = message;
    loadingOverlay.style.display = 'flex'; // IMPORTANT: Explicitly set display to flex
    loadingOverlay.classList.add('visible');

    // Disable all form fields (excluding the button initially)
    signupForm.querySelectorAll('input, select').forEach(element => {
        element.disabled = true;
    });

    // Update and disable the signup button
    signupButton.disabled = true;
    signupButton.textContent = buttonText;
    signupButton.classList.add('opacity-75', 'cursor-not-allowed'); // Add Tailwind classes for visual feedback
}

/**
 * Hides the loading overlay. Also resets the signup button text, but keeps it disabled.
 */
function hideLoading() {
    loadingOverlay.classList.remove('visible');
    loadingOverlay.style.display = 'none'; // IMPORTANT: Explicitly set display to none
    signupButton.textContent = 'Sign Up'; // Revert button text
    // signupButton.disabled remains true from showLoading()
    // signupButton.classList.remove('opacity-75', 'cursor-not-allowed'); // Keep these classes for disabled state
}

// --- Event Listeners ---

// Initial password strength check AND mobile number initialization
window.onload = () => {
    updatePasswordStrength(); // Initial check for password strength

    // Initialize mobile number field with '09' and set cursor position
    if (mobileNumberInput.value === '' || !mobileNumberInput.value.startsWith('09')) {
        mobileNumberInput.value = '09';
    }
    // Set cursor to the end
    mobileNumberInput.setSelectionRange(mobileNumberInput.value.length, mobileNumberInput.value.length);
};

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

// Real-time password strength feedback
passwordInput.addEventListener('input', updatePasswordStrength);


// --- Mobile Number Input Logic ---

// Handles input changes (typing, pasting) to enforce '09' prefix and length
mobileNumberInput.addEventListener('input', (event) => {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-numeric characters

    // Ensure it always starts with '09'
    if (!value.startsWith('09')) {
        // If '09' was somehow removed or not at the start, prepend it.
        // Try to keep digits after '09' if they exist in the original value.
        const indexOf09 = event.target.value.indexOf('09');
        if (indexOf09 !== -1) {
            value = '09' + value.substring(indexOf09 + 2);
        } else {
            value = '09' + value;
        }
    }

    // Limit to 11 characters (09 + 9 digits)
    if (value.length > 11) {
        value = value.slice(0, 11);
    }

    // If the value somehow becomes shorter than 2 characters (e.g., if someone tries to cut '09'), enforce '09'
    if (value.length < 2) {
        value = '09';
    }

    event.target.value = value;

    // Crucial: Maintain cursor position. If cursor is at or before '09', move it after '09'.
    // This is important after paste operations or if user tries to move cursor left.
    if (mobileNumberInput.selectionStart < 2) {
        mobileNumberInput.setSelectionRange(2, 2);
    }
});

// Prevents non-numeric characters from being typed
mobileNumberInput.addEventListener('keypress', (event) => {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) { // Only allow 0-9
        event.preventDefault();
    }
});

// Prevents backspace/delete from removing '09'
mobileNumberInput.addEventListener('keydown', (event) => {
    const start = mobileNumberInput.selectionStart;
    const end = mobileNumberInput.selectionEnd;

    // If backspace or delete key is pressed AND the selection is entirely within '09' or attempts to delete '09'
    if ((event.key === 'Backspace' || event.key === 'Delete') && end <= 2) {
        event.preventDefault();
        // If they try to backspace/delete '09', move cursor to after '09'
        mobileNumberInput.setSelectionRange(2, 2);
    }
});

// Ensures cursor is always at the end or after '09' when the field is focused
mobileNumberInput.addEventListener('focus', () => {
    if (mobileNumberInput.value.length < 2) { // Ensure it's '09' if somehow empty
        mobileNumberInput.value = '09';
    }
    // Always place cursor at the end (after '09' or after typed digits)
    mobileNumberInput.setSelectionRange(mobileNumberInput.value.length, mobileNumberInput.value.length);
});

// --- End Mobile Number Input Logic ---


// Form submission handler
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    let isValid = true; // Flag to track overall form validity

    // Clear previous errors for all fields
    document.querySelectorAll('.text-red-500').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
    showMessage('', 'clear'); // Clear any previous general messages

    // --- Client-Side Validation ---
    if (!firstNameInput.value.trim()) {
        formErrorResponse('first_name-error', 'First Name is required');
        isValid = false;
    }
    if (!lastNameInput.value.trim()) {
        formErrorResponse('last_name-error', 'Last Name is required');
        isValid = false;
    }
    if (!genderInput.value) {
        formErrorResponse('gender-error', 'Gender is required');
        isValid = false;
    }
    if (!cityInput.value) {
        formErrorResponse('city-error', 'City is required');
        isValid = false;
    }

    const facebookLinkPattern = /^(https?:\/\/(www\.)?)?facebook\.com\/[a-zA-Z0-9\.]+(\/?)$/i;
    if (!facebookLinkInput.value.trim()) {
        formErrorResponse('facebook_link-error', 'Facebook Link is required');
        isValid = false;
    } else if (!facebookLinkPattern.test(facebookLinkInput.value.trim())) {
        formErrorResponse('facebook_link-error', 'Please enter a valid Facebook profile URL (e.g., facebook.com/yourprofile)');
        isValid = false;
    }

    const email = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        formErrorResponse('email-error', 'Email is required');
        isValid = false;
    } else if (!emailPattern.test(email)) {
        formErrorResponse('email-error', 'Please enter a valid email address.');
        isValid = false;
    }

    const password = passwordInput.value.trim();
    if (!password) {
        formErrorResponse('password-error', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        formErrorResponse('password-error', 'Password must be at least 6 characters long.');
        isValid = false;
    } else if (password.length > 20) {
        formErrorResponse('password-error', 'Password must be maximum 20 characters long.');
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        formErrorResponse('password-error', 'Password must contain at least one uppercase letter.');
        isValid = false;
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        formErrorResponse('password-error', 'Password must contain at least one special character (e.g., !@#$).');
        isValid = false;
    } else if (!/\d/.test(password)) {
        formErrorResponse('password-error', 'Password must contain at least one numeric digit.');
        isValid = false;
    }

    const mobileNumber = mobileNumberInput.value.trim();
    if (!mobileNumber) { // This check is mostly for initial state or if someone bypasses JS
        formErrorResponse('mobile_number-error', 'Mobile Number is required');
        isValid = false;
    } else if (!/^09\d{9}$/.test(mobileNumber)) {
        formErrorResponse('mobile_number-error', 'Mobile Number must be 11 digits, start with 09, and contain only numbers');
        isValid = false;
    }

    // If all client-side validations pass, proceed with Firebase
    if (isValid) {
        showLoading('Signing you up, please wait...');
        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userId = user.uid; // Get the newly created user's UID

            // --- Send Email Verification ---
            await sendEmailVerification(user);
            console.log("Verification email sent!");

            // Prepare user data for Firestore, including a 'status' for admin approval
            const userData = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                gender: genderInput.value,
                city: cityInput.value,
                facebookLink: facebookLinkInput.value.trim(),
                email: email,
                mobileNumber: mobileNumber,
                createdAt: new Date(),
                userId: userId, // Store the user's UID
                status: 'pending' // Initial status for admin approval
            };

            // Save user data to Firestore
            const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userId}/user_profiles`, 'profile_data');
            await setDoc(userProfileDocRef, userData);

            // --- Post-signup feedback and handling ---
            const successHtmlMessage = `
                <strong>Your registration has been successfully submitted.</strong>
                <p style="margin-top: 1rem; margin-bottom: 0.5rem; font-weight: normal;">Please take the following steps to activate your account:</p>
                <ol>
                    <li><strong>1. Email Verification:</strong> <span>A verification email has been sent to your inbox. Kindly click the link within the email to verify your address.</span></li>
                    <li><strong>2. Administrative Review:</strong> <span>Upon successful email verification, your account will undergo a review by our administration team. Your account status is currently pending approval.</span></li>
                    <li><strong>3. Account Activation:</strong> <span>You will receive a separate email notification once your account has been approved and activated.</span></li>
                </ol>
                <button id="close-success-message-button" class="mt-4 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-all duration-300">
                    Close & Proceed to Login
                </button>
            `;
            showMessage(successHtmlMessage, 'success', true); // Pass true for isHtml

            // Hide the loading overlay immediately
            hideLoading();

            // Immediately sign out the user.
            await signOut(auth);
            console.log("User signed out after signup for verification process.");

            signupForm.reset(); // Clear the form
            mobileNumberInput.value = '09'; // Reset mobile number field specifically
            updatePasswordStrength(); // Reset password strength indicators

            // IMPORTANT: Hide the entire signup form here.
            signupForm.style.display = 'none'; // This is the key change for hiding the form

        } catch (error) {
            console.error("Error during sign up or saving to Firestore:", error);
            let errorMessage = "An unknown error occurred during sign up.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'The email address is already in use by another account.';
                formErrorResponse('email-error', errorMessage);
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak. Please use a stronger password.';
                formErrorResponse('password-error', errorMessage);
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.message) {
                errorMessage = error.message; // Catch generic Firebase errors like "Missing or insufficient permissions."
            }
            showMessage(`Sign Up failed: ${errorMessage}`, 'error', false); // Pass false for plain text error
            hideLoading(); // Hide loading UI on error (and re-enable form)
        }
    }
});

// Switch to Login Page (This link will now trigger the same close/redirect logic)
loginLink.addEventListener('click', (event) => {
    event.preventDefault();
    // You can choose to show an info message here, or just directly trigger the close/redirect logic
    showMessage('Redirecting to Login Page...', 'info', false);
    window.location.href = 'userloginform.html'; // Ensure this points to your login form
});
