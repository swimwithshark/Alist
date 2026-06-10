// ==========================================
// 1. FIREBASE IMPORTS (Modular v10)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// CHANGED: Using signInWithPopup instead of redirect methods
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ==========================================
// 2. FIREBASE CONFIGURATION (PASTE YOUR REAL KEYS HERE)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBizwnFSAzmAPFVdHhSGnv9kzBqTrwBqAk",
  authDomain: "alist-d2daf.firebaseapp.com",
  projectId: "alist-d2daf",
  storageBucket: "alist-d2daf.firebasestorage.app",
  messagingSenderId: "496087358090",
  appId: "1:496087358090:web:a38a738717c8082648eb73"
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
// 4. AUTHENTICATION LOGIC (POPUP METHOD)
// ==========================================

// Trigger Google Sign-In via Popup
loginBtn.addEventListener('click', () => {
    console.log("Login button clicked. Opening Google Popup...");
    loginBtn.innerText = "Opening Popup...";
    
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Logged in successfully via popup!", result.user);
        })
        .catch((error) => {
            console.error("Popup Login Failed:", error);
            alert("Login Error:\nCode: " + error.code + "\nMessage: " + error.message);
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

// Master Observer: Watches to see if user is logged in or out
onAuthStateChanged(auth, (user) => {
    console.log("Auth State Changed. Current User:", user ? user.email : "None");
    
    if (user) {
        // User is LOGGED IN: Reveal the app, hide login panel
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        loadClients(); 
    } else {
        // User is LOGGED OUT: Show login panel, lock down view
        loginSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        clientList.innerHTML = ""; 
        clientsData = [];
        loginBtn.innerText = "Sign in with Google"; 
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
        
        let yyString = yy.toString();
        if (yyString.length === 1) {
            yyString = '0' + yyString;
        }
        
        const formattedDOB = century + yyString + "-" + mm + "-" + dd;
        
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
        console.error("Error writing to Firestore: ", error);
        alert("Database Error: " + error.message + "\nMake sure your Firestore Rules allow writes!");
    }
});

// ==========================================
// 7. DATABASE FUNCTIONS: LOAD CLIENTS
// ==========================================
async function loadClients() {
    console.log("Loading client data...");
    clientList.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Loading client data...</td></tr>";
    clientsData = []; 
    
    try {
        const q = query(collection(db, "clients"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            clientsData.push({ id: doc.id, ...doc.data() });
        });
        
        console.log("Loaded " + clientsData.length + " clients.");
        renderTable(clientsData);
    } catch (error) {
        console.error("Error fetching clients:", error);
        clientList.innerHTML = "<tr><td colspan='5' style='color:red; text-align:center;'>Error loading data: " + error.message + "</td></tr>";
    }
}

// ==========================================
// 8. RENDER TABLE & SEARCH
// ==========================================
function renderTable(data) {
    clientList.innerHTML = "";
    
    if (data.length === 0) {
        clientList.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No clients found. Add one above!</td></tr>";
        return;
    }

    data.forEach(client => {
        const row = "<tr>" +
            "<td><strong>" + client.name + "</strong></td>" +
            "<td>" + client.nric + "</td>" +
            "<td>" + client.dob + "</td>" +
            "<td>" + client.mobile + "</td>" +
            "<td>" + client.remarks + "</td>" +
        "</tr>";
        clientList.innerHTML += row;
    });
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = clientsData.filter(c => 
        (c.name && c.name.toLowerCase().includes(term)) || 
        (c.nric && c.nric.includes(term)) || 
        (c.mobile && c.mobile.includes(term))
    );
    renderTable(filtered);
});
