// 1. Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 2. Your Firebase Configuration (PASTE YOUR KEYS HERE)
const firebaseConfig = {
  apiKey: "AIzaSyBizwnFSAzmAPFVdHhSGnv9kzBqTrwBqAk",
  authDomain: "alist-d2daf.firebaseapp.com",
  projectId: "alist-d2daf",
  storageBucket: "alist-d2daf.firebasestorage.app",
  messagingSenderId: "496087358090",
  appId: "1:496087358090:web:a38a738717c8082648eb73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 3. DOM Elements
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const clientForm = document.getElementById('clientForm');
const nricInput = document.getElementById('nric');
const dobInput = document.getElementById('dob');
const searchInput = document.getElementById('searchInput');
const clientList = document.getElementById('clientList');

let clientsData = []; // Store fetched clients locally for search

// 4. Authentication Logic
loginBtn.addEventListener('click', () => {
    // Uses redirect method which is safer for mobile browsers (avoids popup blockers)
    signInWithRedirect(auth, provider);
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Failed", error);
    }
});

// Monitor Login State
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Logged in: Show app, hide login, load data
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        loadClients(); 
    } else {
        // Logged out: Show login, hide app, clear local data
        loginSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        clientList.innerHTML = ''; 
        clientsData = [];
    }
});

// 5. Auto-Populate DOB from NRIC Logic
nricInput.addEventListener('input', (e) => {
    const nric = e.target.value.replace(/\D/g, ''); // Strip non-numeric characters (like dashes)
    
    if (nric.length >= 6) {
        let yy = parseInt(nric.substring(0, 2));
        const mm = nric.substring(2, 4);
        const dd = nric.substring(4, 6);
        
        // Determine century. Assuming current year is 2026: if YY is > 26, born in 19XX
        const currentYear2Digits = new Date().getFullYear() % 100;
        const century = yy > currentYear2Digits ? '19' : '20';
        
        const formattedDOB = `${century}${yy.toString().padStart(2, '0')}-${mm}-${dd}`;
        
        // Validate month and day to prevent weird inputs from populating invalid dates
        if (parseInt(mm) > 0 && parseInt(mm) <= 12 && parseInt(dd) > 0 && parseInt(dd) <= 31) {
            dobInput.value = formattedDOB;
        }
    }
});

// 6. Database Functions (Save)
clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Create client object
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
        // Save to Firestore
        await addDoc(collection(db, "clients"), newClient);
        alert("Client saved successfully!");
        clientForm.reset();
        loadClients(); // Refresh the table automatically
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error saving client. Ensure you are logged in and database rules allow writes.");
    }
});

// 7. Database Functions (Load & Render Table)
async function loadClients() {
    clientList.innerHTML = '<tr><td colspan="5">Loading client data...</td></tr>';
    clientsData = []; 
    
    try {
        const q = query(collection(db, "clients"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            clientsData.push({ id: doc.id, ...doc.data() });
        });
        
        renderTable(clientsData);
    } catch (error) {
        console.error("Error fetching clients:", error);
        clientList.innerHTML = '<tr><td colspan="5">Error loading data. Check console.</td></tr>';
    }
}

function renderTable(data) {
    clientList.innerHTML = '';
    
    if (data.length === 0) {
        clientList.innerHTML = '<tr><td colspan="5">No clients found.</td></tr>';
        return;
    }

    data.forEach(client => {
        const row = `<tr>
            <td><strong>${client.name}</strong></td>
            <td>${client.nric}</td>
            <td>${client.dob}</td>
            <td>${client.mobile}</td>
            <td>${client.remarks}</td>
        </tr>`;
        clientList.innerHTML += row;
    });
}

// 8. Search Functionality
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = clientsData.filter(c => 
        (c.name && c.name.toLowerCase().includes(term)) || 
        (c.nric && c.nric.includes(term)) || 
        (c.mobile && c.mobile.includes(term))
    );
    renderTable(filtered);
});
