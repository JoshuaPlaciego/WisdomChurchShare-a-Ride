// js/signup-form.js

// Import Firebase instances and authentication function from firebase-init.js
import { auth, db, appId, getUserId } from './firebase-init.js';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


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


const signupForm = document.getElementById('signup-form');
const mainContentContainer = document.getElementById('main-content-container');

// Debugging logs for DOM elements
if (!signupForm) {
    console.error("Error: #signup-form not found! Please check your HTML.");
} else {
    console.log("signupForm element found:", signupForm);
}
if (!mainContentContainer) {
    console.error("Error: #main-content-container not found! Please check your HTML.");
} else {
    console.log("mainContentContainer element found:", mainContentContainer);
}


const loginLink = document.getElementById('login-link');
const firstNameInput = document.getElementById('first_name');
const lastNameInput = document.getElementById('last_name');
const genderInput = document.getElementById('gender');
const cityInput = document.getElementById('city');
const roleInput = document.getElementById('role');
const facebookLinkInput = document.getElementById('facebook_link');
const emailInput = document.getElementById('email');
const mobileNumberInput = document.getElementById('mobile_number');
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.getElementById('toggle-password');
const signupButton = document.getElementById('signup-button');

// Password strength checker elements
const passwordLengthCheck = document.getElementById('password-length-check');
const passwordCapitalCheck = document.getElementById('password-capital-check');
const passwordSymbolCheck = document.getElementById('password-symbol-check');
const passwordNumberCheck = document.getElementById('password-number-check');

// NEW: Password Strength Gauge Elements
const passwordStrengthGauge = document.getElementById('password-strength-gauge');
const passwordStrengthText = document.getElementById('password-strength-text');


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
    if (!messageBox) {
        console.error("showMessage: #message-box element is missing. Cannot display message.");
        return;
    }

    // Clear previous classes and content
    messageBox.classList.remove('show', 'success', 'error', 'info');
    if (messageContent) messageContent.innerHTML = ''; // Clear content div

    

    // --- NEW CODE START ---
    // Create a map of types to icons for dynamic display
    const iconMap = {
        'success': successIcon,
        'error': errorIcon,
        'info': infoIcon
    };

    // Hide all icons first using the map (DRYing this part)
    Object.values(iconMap).forEach(icon => {
        if (icon) icon.style.display = 'none';
    });
    // --- NEW CODE END ---

    if (type === 'clear') {
        messageBox.style.display = 'none';
        if (mainContentContainer) {
             mainContentContainer.classList.remove('hide-main-content');
             console.log("CLEAR: mainContentContainer shown.");
        }
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

 // --- NEW CODE START ---
// Show the appropriate icon based on type using the map (DRYing this part)
if (iconMap[type]) {
    iconMap[type].style.display = 'block';
}
// --- NEW CODE END ---

// ... (rest of the showMessage function, specifically the 'if (type === 'success' ...' block) ...

    // Add event listener for the Close button if it's a success message
    if (type === 'success' && isHtml) {
        if (mainContentContainer) {
            mainContentContainer.classList.add('hide-main-content');
            console.log("SUCCESS: mainContentContainer hidden.");
        } else {
            console.error("Could not hide mainContentContainer: element not found.");
        }

        const closeButton = messageBox.querySelector('#close-success-message-button');
        if (closeButton) {
            closeButton.removeEventListener('click', handleSuccessClose);
            closeButton.addEventListener('click', handleSuccessClose);
        }
    } else {
        // For other message types (error/info), hide automatically after 5 seconds
        setTimeout(() => {
            if (messageBox.classList.contains(type)) {
                messageBox.classList.remove('show');
                messageBox.classList.remove(type);
                if (messageContent) messageContent.innerHTML = '';
                // --- NEW CODE START ---
    // Hide all icons when message box is cleared using the map (DRYing this part)
    Object.values(iconMap).forEach(icon => {
        if (icon) icon.style.display = 'none';
    });
    // --- NEW CODE END ---

                messageBox.style.display = 'none';
                if (mainContentContainer) {
                    mainContentContainer.classList.remove('hide-main-content');
                    console.log("ERROR/INFO: mainContentContainer reshown.");
                }
                signupForm.querySelectorAll('input, select').forEach(element => {
                    element.disabled = false;
                });
                signupButton.disabled = false;
                signupButton.textContent = 'Sign Up';
                signupButton.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        }, 5000);
    }
}

/**
 * Handles the click event for the success message's close button.
 * This function will hide the message and redirect to login.
 */
function handleSuccessClose() {
    messageBox.classList.remove('show', 'success', 'error', 'info');
    messageBox.style.display = 'none';
    if (messageContent) messageContent.innerHTML = '';
    if (successIcon) successIcon.style.display = 'none';
    if (errorIcon) errorIcon.style.display = 'none';
    if (infoIcon) infoIcon.style.display = 'none';


    if (mainContentContainer) {
        mainContentContainer.classList.add('hide-main-content');
        console.log("CLOSE BUTTON: mainContentContainer hidden before redirect.");
    }

    setTimeout(() => {
        window.location.href = 'userloginform.html';
    }, 50);
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

// ... (your existing formErrorResponse function ends here) ...

/**
 * Clears all displayed error messages from the form.
 */
function clearAllFormErrors() {
    // Selects all elements that have the class 'text-red-500' (your error message divs)
    document.querySelectorAll('.text-red-500').forEach(el => {
        // Hides the error message div
        el.style.display = 'none';
        // Clears any text content from the error message div
        el.textContent = '';
    });
}

// ... (your existing updatePasswordStrength function or other code continues here) ...



/**
 * Updates the visual indicators for password strength based on the input value.
 */
function updatePasswordStrength() {
    const password = passwordInput.value;

    const updateCheck = (element, condition) => {
        if (element) {
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

/**
 * Checks password strength and updates the visual gauge and text.
 * This is a more complex scoring system than just pass/fail for requirements.
 * @param {string} password - The password string to evaluate.
 */
function checkPasswordStrengthAndDisplayGauge(password) {
    let score = 0;
    const requirements = [
        { regex: /[a-z]/, points: 1, met: false }, // Lowercase letters
        { regex: /[A-Z]/, points: 1, met: false }, // Uppercase letters
        { regex: /\d/, points: 1, met: false },    // Numbers
        { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, points: 2, met: false } // Special characters
    ];

    // Check for character type diversity
    requirements.forEach(req => {
        if (req.regex.test(password)) {
            score += req.points;
            req.met = true;
        }
    });

    // Length bonus (more length = more points, up to a point)
    if (password.length >= 8) score += 2;
    if (password.length >= 12) score += 2;
    if (password.length >= 16) score += 2;

    // Deduct points for too short
    if (password.length < 6) score = 0;

    // Cap the score and determine strength level
    let strengthLevel = 0; // 0: Very Weak, 1: Weak, 2: Medium, 3: Strong, 4: Excellent
    let strengthText = 'Very Weak';

    if (password.length === 0) {
        score = 0;
        strengthLevel = 0;
        strengthText = 'Type password...';
    } else if (score < 3) { // Only meets 1-2 types, or very short
        strengthLevel = 0;
        strengthText = 'Very Weak';
    } else if (score < 5) { // Meets 2-3 types, moderate length
        strengthLevel = 1;
        strengthText = 'Weak';
    } else if (score < 7) { // Meets 3-4 types, good length
        strengthLevel = 2;
        strengthText = 'Medium';
    } else if (score < 9) { // Meets all types, good length
        strengthLevel = 3;
        strengthText = 'Strong';
    } else { // Excellent, very long and diverse
        strengthLevel = 4;
        strengthText = 'Excellent';
    }

    // Adjust score for gauge width based on level
    let gaugeWidth = (strengthLevel + 1) * 20; // 20%, 40%, 60%, 80%, 100%
    if (password.length === 0) gaugeWidth = 0; // No password, no gauge

    // Update gauge bar
    passwordStrengthGauge.style.width = `${gaugeWidth}%`;
    passwordStrengthGauge.className = `h-2 rounded-full transition-all duration-300 ease-in-out strength-${strengthLevel}`;

    // Update text
    passwordStrengthText.textContent = strengthText;
    passwordStrengthText.className = `text-xs mt-1 font-semibold text-strength-${strengthLevel}`;

    // Ensure the main password requirements list also updates (already handled by updatePasswordStrength)
}

// --- Loading UI Functions ---
/**
 * Shows the loading overlay, disables the form, and updates the button text.
 * @param {string} message - Message for the central loading UI.
 * @param {string} buttonText - Text to display on the submit button during loading.
 */
function showLoading(message = 'Please wait...', buttonText = 'Signing you up. Please wait...') {
    loadingMessage.textContent = message;
    loadingOverlay.style.display = 'flex';
    loadingOverlay.classList.add('visible');

    signupForm.querySelectorAll('input, select').forEach(element => {
        element.disabled = true;
    });

    signupButton.disabled = true;
    signupButton.textContent = buttonText;
    signupButton.classList.add('opacity-75', 'cursor-not-allowed');
}

/**
 * Hides the loading overlay. Also resets the signup button text, but keeps it disabled.
 */
function hideLoading() {
    loadingOverlay.classList.remove('visible');
    loadingOverlay.style.display = 'none';
    signupButton.textContent = 'Sign Up';
}

// --- Event Listeners ---

// Initial password strength check AND mobile number initialization
window.onload = () => {
    updatePasswordStrength();
    checkPasswordStrengthAndDisplayGauge(passwordInput.value); // NEW: Initial gauge check

    if (mobileNumberInput.value === '' || !mobileNumberInput.value.startsWith('09')) {
        mobileNumberInput.value = '09';
    }
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
passwordInput.addEventListener('input', () => {
    updatePasswordStrength(); // Existing function for criteria list
    checkPasswordStrengthAndDisplayGauge(passwordInput.value); // NEW: Update the gauge
});


// --- Mobile Number Input Logic ---

mobileNumberInput.addEventListener('input', (event) => {
    let value = event.target.value.replace(/\D/g, '');

    if (!value.startsWith('09')) {
        const indexOf09 = event.target.value.indexOf('09');
        if (indexOf09 !== -1) {
            value = '09' + value.substring(indexOf09 + 2);
        } else {
            value = '09' + value;
        }
    }

    if (value.length > 11) {
        value = value.slice(0, 11);
    }

    if (value.length < 2) {
        value = '09';
    }

    event.target.value = value;

    if (mobileNumberInput.selectionStart < 2) {
        mobileNumberInput.setSelectionRange(2, 2);
    }
});

mobileNumberInput.addEventListener('keypress', (event) => {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
        event.preventDefault();
    }
});

mobileNumberInput.addEventListener('keydown', (event) => {
    const start = mobileNumberInput.selectionStart;
    const end = mobileNumberInput.selectionEnd;

    if ((event.key === 'Backspace' || event.key === 'Delete') && end <= 2) {
        event.preventDefault();
        mobileNumberInput.setSelectionRange(2, 2);
    }
});

mobileNumberInput.addEventListener('focus', () => {
    if (mobileNumberInput.value.length < 2) {
        mobileNumberInput.value = '09';
    }
    mobileNumberInput.setSelectionRange(mobileNumberInput.value.length, mobileNumberInput.value.length);
});

// --- End Mobile Number Input Logic ---


// Form submission handler
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    let isValid = true;

    // NEW: Clear all form errors using the helper function
    clearAllFormErrors();
    showMessage('', 'clear'); // This line is fine and should remain

    // ... rest of your validation code ...
});

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
    if (!roleInput.value) {
        formErrorResponse('role-error', 'Role is required');
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
    if (!mobileNumber) {
        formErrorResponse('mobile_number-error', 'Mobile Number is required');
        isValid = false;
    } else if (!/^09\d{9}$/.test(mobileNumber)) {
        formErrorResponse('mobile_number-error', 'Mobile Number must be 11 digits, start with 09, and contain only numbers');
        isValid = false;
    }

    if (isValid) {
        showLoading('Signing you up, please wait...');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userId = user.uid;

            await sendEmailVerification(user);
            console.log("Verification email sent!");

            const userData = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                gender: genderInput.value,
                city: cityInput.value,
                role: roleInput.value,
                facebookLink: facebookLinkInput.value.trim(),
                email: email,
                mobileNumber: mobileNumber,
                createdAt: new Date(),
                userId: userId,
                status: 'pending'
            };

            const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userId}/user_profiles`, 'profile_data');
            await setDoc(userProfileDocRef, userData);

            const successHtmlMessage = `
                <strong>Your registration has been successfully submitted.</strong>
                <p style="margin-top: 1rem; margin-bottom: 0.5rem; font-weight: normal;">Please take the following steps to activate your account:</p>
                <ol>
                    <li><strong>1. Email Verification:</strong> <span>A verification email has been sent to your inbox. Kindly click the link within the email to verify your address.</span></li>
                    <li><strong>2. Administrative Review:</strong> <span>Upon successful email verification, your account will undergo a review by our administration team. Your account status is currently pending approval.</span></li>
                    <li><strong>3. Account Activation:</strong> <span>You will receive a separate email notification once your account has been approved and activated.</span></li>
                </ol>
                <button id="close-success-message-button" class="message-box-button">
                    Close & Proceed to Login
                </button>
            `;
            showMessage(successHtmlMessage, 'success', true);

            hideLoading();
            await signOut(auth);
            console.log("User signed out after signup for verification process.");

            signupForm.reset();
            mobileNumberInput.value = '09';
            updatePasswordStrength();
            checkPasswordStrengthAndDisplayGauge(''); // NEW: Reset gauge after successful signup

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
                errorMessage = error.message;
            }
            // For general errors, display in the message box with the error type
            showMessage(`Sign Up failed: ${errorMessage}`, 'error', false);
            hideLoading();
        }
    }
});

// Switch to Login Page
loginLink.addEventListener('click', (event) => {
    event.preventDefault();
    showMessage('Redirecting to Login Page...', 'info', false);
    window.location.href = 'userloginform.html';
});