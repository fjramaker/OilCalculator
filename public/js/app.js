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

// 1. Initial Data Load
async function loadData() {
    try {
        const response = await fetch('doterra_products.json');
        allProducts = await response.json();
        setupToggles();
        populateSelectors();
        renderCarriers();
    } catch (err) {
        console.error("Data load failed", err);
    }
}

// 2. State & Toggles
function setupToggles() {
    // Load from LocalStorage
    const drops = localStorage.getItem('cfg_drops') || 20;
    document.getElementById('global-drops-cfg').value = drops;

    // Listeners for persistence
    document.querySelectorAll('input[name="lang"], input[name="price"], #global-drops-cfg').forEach(el => {
        el.addEventListener('change', () => {
            localStorage.setItem('cfg_drops', document.getElementById('global-drops-cfg').value);
            populateSelectors();
            renderCarriers();
            calculateEverything();
        });
    });
}

function getSettings() {
    return {
        dropsPerML: parseFloat(document.getElementById('global-drops-cfg').value) || 20,
        isCN: document.getElementById('lang-cn').checked,
        useMem: document.getElementById('price-mem').checked
    };
}

// 3. UI Helpers
function populateSelectors() {
    const s = getSettings();
    const oilSelects = document.querySelectorAll('select[id$="select"]'); // Matches single and recipe
    const oils = allProducts.filter(p => p.is_oil && p.unit === "mL");
    
    // Create list of unique Name + Size strings
    const options = oils.map(p => `<option value="${p.itemNo}">${s.isCN ? p.nameCN : p.name} (${p.size}mL)</option>`).join('');
    
    oilSelects.forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = `<option value="">Select Oil</option>` + options;
        sel.value = currentVal;
    });
}

// 4. Calculation Engine
window.calculateEverything = function() {
    const s = getSettings();
    let blendCost = 0;
    let totalDrops = 0;

    // Calculate Formula Frame
    const singleId = document.getElementById('single-oil-select').value;
    const formulaDiv = document.getElementById('formula-display');
    if (singleId) {
        const p = allProducts.find(x => x.itemNo === singleId);
        const price = s.useMem ? p.member_hkd : p.retail_hkd;
        const cpd = price / (parseFloat(p.size) * s.dropsPerML);
        formulaDiv.innerHTML = `$$Cost = \\frac{${price}}{${p.size} \\times ${s.dropsPerML}} = HKD\\ ${cpd.toFixed(2)}/drop$$`;
        // Re-render LaTeX if using MathJax, or just text
    }

    // Recipe Summing
    document.querySelectorAll('.recipe-line').forEach(line => {
        const id = line.querySelector('.oil-id').value;
        const count = parseFloat(line.querySelector('.drop-count').value) || 0;
        if (id) {
            const p = allProducts.find(x => x.itemNo === id);
            const price = s.useMem ? p.member_hkd : p.retail_hkd;
            blendCost += (price / (parseFloat(p.size) * s.dropsPerML)) * count;
            totalDrops += count;
        }
    });

    document.getElementById('total-drops-sum').textContent = totalDrops;
    document.getElementById('blend-total-cost').textContent = blendCost.toFixed(2);
    
    // Total
    const addCost = parseFloat(document.getElementById('add-total-cost').textContent) || 0;
    document.getElementById('final-total-price').textContent = (blendCost + addCost).toFixed(2);
};

// 5. Dynamic Elements
window.addRecipeLine = function() {
    const container = document.getElementById('recipe-lines');
    const div = document.createElement('div');
    div.className = "recipe-line d-flex gap-2 align-items-center";
    div.innerHTML = `
        <select class="form-select form-select-sm oil-id" onchange="calculateEverything()"></select>
        <input type="number" class="form-control form-control-sm drop-count" value="1" style="width:70px" onchange="calculateEverything()">
        <button class="btn btn-sm text-danger" onclick="this.parentElement.remove(); calculateEverything()">×</button>
    `;
    container.appendChild(div);
    populateSelectors();
};

window.adjustDrops = function(val) {
    const el = document.getElementById('global-drops-cfg');
    el.value = Math.max(1, parseInt(el.value) + val);
    calculateEverything();
};

// Logbook char count
document.getElementById('log-why').addEventListener('input', function() {
    document.getElementById('char-count').textContent = `${this.value.length}/288`;
});

// Start everything when logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadData();
        // ... (rest of auth logic)
    }
});