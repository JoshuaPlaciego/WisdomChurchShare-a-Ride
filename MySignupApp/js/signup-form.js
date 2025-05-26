// js/signup-form.js

// Import Firebase instances and authentication function from firebase-init.js
import { auth, db, appId, authenticateFirebase, getUserId } from './firebase-init.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// DOM element references
const messageBox = document.getElementById('message-box');
const signupForm = document.getElementById('signup-form');
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
const selfieWithIdInput = document.getElementById('selfie_with_id');

// Password strength checker elements
const passwordLengthCheck = document.getElementById('password-length-check');
const passwordCapitalCheck = document.getElementById('password-capital-check');
const passwordSymbolCheck = document.getElementById('password-symbol-check');
const passwordNumberCheck = document.getElementById('password-number-check');

/**
 * Displays a message in the message box.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('success', 'error', 'info', 'clear').
 */
function showMessage(message, type = 'success') {
    messageBox.textContent = message;
    if (type === 'clear') {
        messageBox.classList.remove('show', 'success', 'error', 'info');
        messageBox.textContent = '';
        return;
    }
    messageBox.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-md show ${type}`;
    setTimeout(() => {
        messageBox.classList.remove('show');
        messageBox.classList.remove(type);
        messageBox.textContent = '';
    }, 3000);
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
 * Updates the visual indicators for password strength based on the input value.
 */
function updatePasswordStrength() {
    const password = passwordInput.value;

    // Helper to update check status
    const updateCheck = (element, condition) => {
        if (condition) {
            element.classList.remove('text-red-500');
            element.classList.add('text-green-600');
        } else {
            element.classList.remove('text-green-600');
            element.classList.add('text-red-500');
        }
    };

    updateCheck(passwordLengthCheck, password.length >= 6 && password.length <= 20);
    updateCheck(passwordCapitalCheck, /[A-Z]/.test(password));
    updateCheck(passwordSymbolCheck, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
    updateCheck(passwordNumberCheck, /\d/.test(password));
}

// --- Event Listeners ---

// Authenticate Firebase on window load
window.onload = async () => {
    try {
        await authenticateFirebase();
    } catch (error) {
        showMessage(`Failed to initialize Firebase: ${error.message}`, 'error');
    }
    updatePasswordStrength(); // Initial check for password strength
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

// Mobile Number input formatting
mobileNumberInput.addEventListener('input', (event) => {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    if (value.length > 0) {
        if (!value.startsWith('09')) {
            value = '09' + value;
        }
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
    }
    event.target.value = value;
});

mobileNumberInput.addEventListener('keypress', (event) => {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
        event.preventDefault();
    }
});

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
    if (!mobileNumber) {
        formErrorResponse('mobile_number-error', 'Mobile Number is required');
        isValid = false;
    } else if (!/^09\d{9}$/.test(mobileNumber)) {
        formErrorResponse('mobile_number-error', 'Mobile Number must be 11 digits, start with 09, and contain only numbers');
        isValid = false;
    }

    if (!selfieWithIdInput.files || selfieWithIdInput.files.length === 0) {
        formErrorResponse('selfie_with_id-error', 'Selfie is required');
        isValid = false;
    }

    // If all client-side validations pass, proceed with Firebase
    if (isValid) {
        try {
            // Ensure Firebase is authenticated before proceeding
            if (!getUserId()) {
                await authenticateFirebase(); // Re-authenticate if somehow not already
            }

            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userId = user.uid; // Get the newly created user's UID

            // Prepare user data for Firestore
            const userData = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                gender: genderInput.value,
                city: cityInput.value,
                facebookLink: facebookLinkInput.value.trim(),
                email: email,
                mobileNumber: mobileNumber,
                selfieProvided: selfieWithIdInput.files.length > 0 ? true : false,
                createdAt: new Date(),
                userId: userId // Store the user's UID
            };

            // Save user data to Firestore
            const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userId}/user_profiles`, 'profile_data');
            await setDoc(userProfileDocRef, userData);

            showMessage('Sign Up successful! Your data has been saved.', 'success');
            signupForm.reset(); // Clear the form
            updatePasswordStrength(); // Reset password strength indicators

        } catch (error) {
            console.error("Error during sign up or saving to Firestore:", error);
            let errorMessage = "An unknown error occurred during sign up.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'The email address is already in use by another account.';
                formErrorResponse('email-error', errorMessage);
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak. Please use a stronger password.';
                formErrorResponse('password-error', errorMessage);
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(`Sign Up failed: ${errorMessage}`, 'error');
        }
    }
});

// Switch to Login Page (Simulated)
loginLink.addEventListener('click', (event) => {
    event.preventDefault();
    showMessage('Redirecting to Login Page (Simulated)', 'info');
    // In a real application, you would navigate to your login page:
    // window.location.href = 'login.html';
});
