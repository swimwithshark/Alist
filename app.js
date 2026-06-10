// ==========================================
// 1. FIREBASE IMPORTS (Modular v10)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signOut, onAuthStateChanged, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ==========================================
// 2. FIREBASE CONFIGURATION (PASTE YOUR KEYS HERE)
// ==========================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ==========================================
// 3. DOM ELEMENTS
// ==========================================
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const clientForm = document.getElementById('clientForm');
const nricInput = document.getElementById('nric');
const dobInput = document.getElementById('dob');
const searchInput = document.getElementById('searchInput');
const clientList = document.getElementById('clientList');

let clientsData = []; 

// ==========================================
// 4. AUTHENTICATION LOGIC & DIAGNOSTICS
// ==========================================

// Trigger Google Sign-In
loginBtn.addEventListener('click', () => {
    console.log("Login button clicked. Redirecting to Google...");
    loginBtn.innerText = "Redirecting...";
    signInWithRedirect(auth, provider).catch((error) => {
        console.error("Failed to start redirect:", error);
        alert(`Failed to start login: ${error.message}`);
        loginBtn.innerText = "Sign in with Google";
    });
});

// Trigger Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("User logged out successfully.");
    } catch (error) {
        console.error("Logout Failed", error);
    }
});

// DIAGNOSTIC: Catch errors returning from Google
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            console.log("Successful return from Google Redirect!", result.user);
        }
    })
    .catch((error) => {
        console.error("Error returning from Google Redirect:", error);
        alert(`Firebase Auth Error:\nCode: ${error.code}\nMessage: ${error.message}`);
        loginBtn.innerText = "Sign in with Google";
    });

// Master Observer: Watches to see if user is logged in or out
onAuthStateChanged(auth, (user) => {
    console.log("Auth State Changed. Current User:", user ? user.email : "None");
    
    if (user) {
        // User is LOGGED IN
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        loadClients(); 
    } else {
        // User is LOGGED OUT
        loginSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        clientList.innerHTML = ''; 
        clientsData = [];
        loginBtn.innerText = "Sign in with Google"; // Reset button text
    }
});

// ==========================================
// 5. AUTO-POPULATE DOB FROM NRIC
// ==========================================
nricInput.addEventListener('input', (e) => {
    const nric = e.target.value.replace(/\D/g, ''); 
    
    if (nric.length >= 6) {
        let yy = parseInt(nric.substring(0, 2));
        const mm = nric.substring(2, 4);
        const dd = nric.substring(4, 6);
        
        const currentYear2Digits = new Date().getFullYear() % 100;
        const century = yy > currentYear2Digits ? '19' : '20';
        const formattedDOB = `${century}${yy.toString().padStart(2, '0')}-${mm}-${dd}`;
        
        if (parseInt(mm) > 0 && parseInt(mm) <= 12 && parseInt(dd) > 0 && parseInt(dd) <= 31) {
            dobInput.value = formattedDOB;
        }
    }
});

// ==========================================
// 6. DATABASE FUNCTIONS: SAVE CLIENT
// ==========================================
clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newClient = {
        name: document.getElementById('name').value,
        nric: nricInput.value,
        dob: dobInput.value,
        mobile: document.getElementById('mobile').value,
        email: document.getElementById('email').value,
        remarks: document.getElementById('remarks').value,
        segment: "A+", 
        timestamp: new Date()
    };

    try {
        console.log("Attempting to save client to Firestore...");
        await addDoc(collection(db, "clients"), newClient);
        alert("Client saved successfully!");
        clientForm.reset();
        loadClients(); 
    } catch (error) {
        console.error("Error writing to Firestore:
