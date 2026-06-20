// ==========================================
// 1. FIREBASE IMPORTS (Modular v10)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
// Added 'where' to filter database queries
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
// 4. AUTHENTICATION LOGIC
// ==========================================

// Trigger Google Sign-In with a Popup
loginBtn.addEventListener('click', () => {
    console.log("Opening Google Sign-In popup...");
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Logged in successfully:", result.user.email);
        })
        .catch((error) => {
            console.error("Login Failed:", error.code);
            alert("Login Error: " + error.message);
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
        // User is LOGGED IN
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        loadClients(); 
    } else {
        // User is LOGGED OUT
        loginSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        clientList.innerHTML = ""; 
        clientsData = [];
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
    
    // Safety check to ensure a user is logged in
    if (!auth.currentUser) {
        alert("You must be logged in to save data.");
        return;
    }

    const newClient = {
        userId: auth.currentUser.uid, // NEW: Stamped ownership of this document
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
        console.log("Saving client data under User UID:", auth.currentUser.uid);
        await addDoc(collection(db, "clients"), newClient);
        alert("Client saved successfully!");
        clientForm.reset();
        loadClients(); 
    } catch (error) {
        console.error("Error writing to Firestore: ", error);
        alert("Database Error: " + error.message);
    }
});

// ==========================================
// 7. DATABASE FUNCTIONS: LOAD CLIENTS
// ==========================================
async function loadClients() {
    if (!auth.currentUser) return;

    console.log("Loading client data for user:", auth.currentUser.email);
    clientList.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Loading your roster...</td></tr>";
    clientsData = []; 
    
    try {
        // NEW: Only query items where 'userId' equals the logged-in user's unique ID
        const q = query(
            collection(db, "clients"), 
            where("userId", "==", auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            clientsData.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort data locally by timestamp (newest first) to avoid index setup rules in Firebase Console
        clientsData.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
            return timeB - timeA;
        });

        console.log("Successfully loaded " + clientsData.length + " personal records.");
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
