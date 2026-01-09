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

// LOG IN
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

// CALCULATOR
let allProducts = [];
let carriers = [
    { itemNo: "31640306", nameEN: "Coconut Oil", nameCN: "分餾椰子油" },
    { itemNo: "60204156", nameEN: "Hydrating Cream", nameCN: "舒緩保濕乳" }
];

// --- 1. DEFINE WINDOW FUNCTIONS FIRST ---
// This ensures they exist before loadData tries to call them

window.populateSelectors = function() {
    if (!allProducts || allProducts.length === 0) return;

    const s = getSettings();
    const filterEl = document.getElementById('oil-filter');
    const filterText = filterEl ? filterEl.value.toLowerCase() : "";
    
    const filteredOils = allProducts.filter(p => {
        const matchesType = p.is_oil && p.unit === "mL";
        const matchesSearch = p.name.toLowerCase().includes(filterText) || 
                            p.nameCN.includes(filterText);
        return matchesType && matchesSearch;
    });

    const options = filteredOils.map(p => 
        `<option value="${p.itemNo}">${s.isCN ? p.nameCN : p.name} (${p.size}mL)</option>`
    ).join('');

    const allSelects = document.querySelectorAll('#single-oil-select, .oil-id');
    allSelects.forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = `<option value="">Select Oil</option>` + options;
        sel.value = currentVal;
    });
};

window.calculateEverything = function() {
    const s = getSettings();
    const singleId = document.getElementById('single-oil-select').value;
    const formulaDiv = document.getElementById('formula-display');

    if (singleId && formulaDiv) {
        const p = allProducts.find(x => x.itemNo === singleId);
        if (!p) return;
        
        const price = s.useMem ? p.member_hkd : p.retail_hkd;
        const bottleSize = parseFloat(p.size);
        const costPerDrop = price / (bottleSize * s.dropsPerML);

        formulaDiv.innerHTML = `\\[ \\text{Cost/Drop} = \\frac{HKD\\ ${price}}{${bottleSize}mL \\times ${s.dropsPerML}\\text{ dr}} = HKD\\ ${costPerDrop.toFixed(2)} \\]`;
        
        if (window.MathJax && window.MathJax.typeset) {
            window.MathJax.typeset([formulaDiv]);
        }
    } else if (formulaDiv) {
        formulaDiv.innerHTML = "Select an oil to see calculation";
    }
};

window.adjustDrops = function(val) {
    const el = document.getElementById('global-drops-cfg');
    let current = parseInt(el.value) || 20;
    el.value = Math.max(1, current + val);
    localStorage.setItem('cfg_drops', el.value);
    window.calculateEverything();
};

window.addRecipeLine = function() {
    const container = document.getElementById('recipe-lines');
    const div = document.createElement('div');
    div.className = "recipe-line d-flex gap-2 align-items-center mb-2";
    div.innerHTML = `
        <select class="form-select form-select-sm oil-id" onchange="calculateEverything()" style="flex: 2;">
            <option value="">Select Oil</option>
        </select>
        <div class="input-group input-group-sm" style="flex: 1;">
            <input type="number" class="form-control text-center drop-count" value="1" onchange="calculateEverything()">
            <span class="input-group-text small">dr</span>
        </div>
        <button class="btn btn-sm text-danger px-2" onclick="this.parentElement.remove(); calculateEverything()">×</button>
    `;
    container.appendChild(div);
    window.populateSelectors();
};

window.setBottle = function(size, price) {
    const btns = document.querySelectorAll('#bottle-btns button');
    btns.forEach(b => b.classList.remove('active', 'btn-secondary'));
    btns.forEach(b => b.classList.add('btn-outline-secondary'));

    const selectedBtn = event.currentTarget;
    selectedBtn.classList.add('active', 'btn-secondary');
    selectedBtn.classList.remove('btn-outline-secondary');

    window.currentBottleSize = size;
    window.currentBottlePrice = price;
    window.calculateEverything();
};

// --- 2. SUPPORTING LOGIC ---

async function loadData() {
    try {
        const response = await fetch('doterra_products.json');
        allProducts = await response.json();
        setupToggles();
        window.populateSelectors();
        // Placeholder if renderCarriers isn't written yet
        if (typeof renderCarriers === "function") renderCarriers(); 
    } catch (err) {
        console.error("Data load failed", err);
    }
}

function setupToggles() {
    const drops = localStorage.getItem('cfg_drops') || 20;
    document.getElementById('global-drops-cfg').value = drops;

    document.querySelectorAll('input[name="lang"], input[name="price"], #global-drops-cfg').forEach(el => {
        el.addEventListener('change', () => {
            localStorage.setItem('cfg_drops', document.getElementById('global-drops-cfg').value);
            window.populateSelectors();
            if (typeof renderCarriers === "function") renderCarriers();
            window.calculateEverything();
        });
    });
}

function getSettings() {
    const langEl = document.getElementById('lang-cn');
    const priceEl = document.getElementById('price-mem');
    return {
        dropsPerML: parseFloat(document.getElementById('global-drops-cfg').value) || 20,
        isCN: langEl ? langEl.checked : false,
        useMem: priceEl ? priceEl.checked : false
    };
}

// --- 3. INITIALIZATION ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        authView.classList.remove('active');
        appView.classList.add('active');
        loadData();
    } else {
        appView.classList.remove('active');
        authView.classList.add('active');
        authForm.reset();
    }
});

// Logbook char count logic
const logWhy = document.getElementById('log-why');
if (logWhy) {
    logWhy.addEventListener('input', function() {
        document.getElementById('char-count').textContent = `${this.value.length}/288`;
    });
}