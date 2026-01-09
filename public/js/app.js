// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTpf1TpwaSHjFr2LDxNfV2k_kvOH9XNtk",
  authDomain: "oil-calculator-dowellness.firebaseapp.com",
  projectId: "oil-calculator-dowellness",
  storageBucket: "oil-calculator-dowellness.firebasestorage.app",
  messagingSenderId: "76130673860",
  appId: "1:76130673860:web:8978dfd0f6582a44d65591"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const toggleAuthBtn = document.getElementById('toggle-auth');
const authAlert = document.getElementById('auth-alert');
const logoutBtn = document.getElementById('logout-btn');

// State
let isRegistering = false;

// 1. Handle Auth Toggle (Switch between Login and Register)
toggleAuthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    if (isRegistering) {
        document.querySelector('.card-header-custom h4').textContent = "Create Account";
        document.querySelector('.card-header-custom p').textContent = "Join the wellness journey";
        submitBtn.textContent = "Register";
        toggleAuthBtn.textContent = "Already have an account? Login";
    } else {
        document.querySelector('.card-header-custom h4').textContent = "Welcome Back";
        document.querySelector('.card-header-custom p').textContent = "Sign in to manage your blends";
        submitBtn.textContent = "Login";
        toggleAuthBtn.textContent = "Need an account? Register here";
    }
    authAlert.classList.add('d-none'); // Hide errors on toggle
});

// 2. Handle Form Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passInput.value;
    
    authAlert.classList.add('d-none');
    submitBtn.disabled = true;

    try {
        if (isRegistering) {
            await createUserWithEmailAndPassword(auth, email, password);
            // Registration successful, loop will catch it in onAuthStateChanged
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        showError(error.message);
        submitBtn.disabled = false;
    }
});

// 3. Handle Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// 4. Listen for Login State Changes (The "Gatekeeper")
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in -> Show App
        authView.classList.remove('active');
        appView.classList.add('active');
        console.log("User logged in:", user.email);
        
        // TODO: Load the Calculator Data here in the next step
    } else {
        // User is signed out -> Show Login
        appView.classList.remove('active');
        authView.classList.add('active');
        submitBtn.disabled = false;
        authForm.reset();
    }
});

// Helper: Error Formatting
function showError(msg) {
    authAlert.textContent = msg.replace('Firebase: ', '');
    authAlert.classList.remove('d-none');
}