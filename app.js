import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// NEW: Import Authentication modules
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 1. Your Firebase Configuration (Replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBizwnFSAzmAPFVdHhSGnv9kzBqTrwBqAk",
  authDomain: "alist-d2daf.firebaseapp.com",
  projectId: "alist-d2daf",
  storageBucket: "alist-d2daf.firebasestorage.app",
  messagingSenderId: "496087358090",
  appId: "1:496087358090:web:a38a738717c8082648eb73"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 2. DOM Elements
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
// (Keep your existing DOM elements for the form and table here)

// 3. Authentication Logic
loginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login Failed", error);
        alert("Failed to log in.");
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Failed", error);
    }
});

// Listen for login state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        loginSection.style.display = 'none';
        appSection.style.display = 'block';
        loadClients(); // Only load data once authenticated
    } else {
        // User is logged out
        loginSection.style.display = 'block';
        appSection.style.display = 'none';
        clientList.innerHTML = ''; // Clear table data from screen
    }
});

// ... KEEP YOUR EXISTING NRIC, SAVE CLIENT, AND LOAD CLIENTS FUNCTIONS HERE ...
