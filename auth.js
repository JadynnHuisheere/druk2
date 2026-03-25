// auth.js - Firebase Authentication

// Check if user is logged in (use Firebase auth state)
let currentUser = null;

// Get current user
function getCurrentUser() {
    return currentUser;
}

function authIdToEmail(authId) {
    return `${authId}@drukauth.local`;
}

function authIdToPassword(authId, last4) {
    return `${authId}_${last4}_secure`; // deterministic for login
}

function adminLogin(adminId, adminPassword) {
    return firebase.auth().signInWithEmailAndPassword(adminId, adminPassword)
        .then((userCredential) => {
            console.log('Admin login successful:', userCredential.user.email);
            return true;
        })
        .catch((error) => {
            console.error('Admin login error:', error);
            throw new Error(error.message);
        });
}

function getApprovedAuthIds() {
    try {
        const raw = localStorage.getItem('approvedAuthIds');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveApprovedAuthIds(ids) {
    localStorage.setItem('approvedAuthIds', JSON.stringify(ids));
}

function isAdmin(user) {
    if (!user) return false;
    // Admin authID should be manually set or via displayName
    const knownAdminEmails = ['admin@drukauth.local'];
    const storedAdmins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    return knownAdminEmails.includes(user.email) || storedAdmins.includes(user.uid);
}

// Login function by auth ID
function login(authId, idLast4) {
    const email = authIdToEmail(authId);
    const password = authIdToPassword(authId, idLast4);
    console.log('Attempting login for authId:', authId);
    return firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Login successful:', userCredential.user.email);
            return true;
        })
        .catch((error) => {
            console.error('Login error:', error);
            throw new Error(error.message);
        });
}

// Signup function by auth ID
function signup(authId, idLast4) {
    const email = authIdToEmail(authId);
    const password = authIdToPassword(authId, idLast4);
    console.log('Attempting signup for authId:', authId);

    const approvedIds = getApprovedAuthIds();
    if (!approvedIds.includes(authId)) {
        throw new Error('Auth ID not authorized. Ask an admin to add it.');
    }

    return firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Signup successful, setting displayName for:', authId);
            // remove used authId from approvals
            const remaining = approvedIds.filter((id) => id !== authId);
            saveApprovedAuthIds(remaining);
            return userCredential.user.updateProfile({
                displayName: authId
            }).then(() => {
                console.log('Profile updated successfully for:', authId);
                return true;
            });
        })
        .catch((error) => {
            console.error('Signup error:', error);
            throw new Error(error.message);
        });
}

// Logout function
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Auth state observer
firebase.auth().onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? 'logged in as ' + user.email : 'logged out');
    currentUser = user;
    if (user) {
        // User is signed in
        updateUIForUser(user);
    } else {
        // User is signed out
        // Redirect if on protected page
        if (window.location.pathname.includes('car-dashboard.html') ||
            window.location.pathname.includes('car-details.html') ||
            window.location.pathname.includes('my-vehicles.html') ||
            window.location.pathname.includes('watchlist.html')) {
            window.location.href = 'login.html';
        }
    }
});

// Update UI with user info
function updateUIForUser(user) {
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const welcomeEl = document.getElementById('welcomeMessage');
    const userRoleEl = document.querySelector('.user-details p');

    if (userNameEl) userNameEl.textContent = user.displayName || user.email;
    if (userAvatarEl) userAvatarEl.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.displayName || user.email}!`;
    if (userRoleEl) userRoleEl.textContent = isAdmin(user) ? 'Administrator' : 'Member';

    if (isAdmin(user)) {
        renderAdminDropdown();
    }
}

function renderAdminDropdown() {
    const userSection = document.querySelector('.user-section');
    if (!userSection || document.getElementById('adminDropdownContainer')) return;

    const container = document.createElement('div');
    container.id = 'adminDropdownContainer';
    container.style.position = 'relative';
    container.style.marginLeft = '1rem';

    const button = document.createElement('button');
    button.id = 'adminDropdown';
    button.className = 'btn';
    button.style.background = '#25408f';
    button.style.color = 'white';
    button.style.fontSize = '0.85rem';
    button.style.padding = '0.25rem 0.6rem';
    button.textContent = 'ADMIN ▾';

    const menu = document.createElement('div');
    menu.id = 'adminDropdownMenu';
    menu.style.position = 'absolute';
    menu.style.top = '2.2rem';
    menu.style.right = '0';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    menu.style.display = 'none';
    menu.style.width = '180px';
    menu.style.zIndex = '999';

    const action = document.createElement('button');
    action.textContent = 'Add User';
    action.style.display = 'block';
    action.style.width = '100%';
    action.style.padding = '0.65rem';
    action.style.border = 'none';
    action.style.background = 'none';
    action.style.textAlign = 'left';
    action.style.cursor = 'pointer';
    action.addEventListener('click', function() {
        menu.style.display = 'none';
        openAddUserModal();
    });

    menu.appendChild(action);
    container.appendChild(button);
    container.appendChild(menu);
    userSection.appendChild(container);

    button.addEventListener('click', () => {
        menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        menu.style.flexDirection = 'column';
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target) && menu.style.display === 'flex') {
            menu.style.display = 'none';
        }
    });
}

function openAddUserModal() {
    if (document.getElementById('adminAddUserModal')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'adminAddUserModal';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.65)';
    modalOverlay.style.zIndex = '9999';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.justifyContent = 'center';

    const card = document.createElement('div');
    card.style.background = 'var(--card-bg)';
    card.style.padding = '1.2rem';
    card.style.borderRadius = '8px';
    card.style.width = '360px';
    card.style.border = '1px solid var(--border-color)';
    card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';

    card.innerHTML = `
        <h3 style="margin-top:0;">Add New User (Admin)</h3>
        <div style="margin: 0.5rem 0;"><label>Name</label><input id="newUserName" style="width:100%; padding:0.55rem; margin-top:0.25rem;"/></div>
        <div style="margin: 0.5rem 0;"><label>Position / Role</label><input id="newUserRole" style="width:100%; padding:0.55rem; margin-top:0.25rem;"/></div>
        <div style="margin: 0.5rem 0;"><label>Department</label><input id="newUserDept" style="width:100%; padding:0.55rem; margin-top:0.25rem;"/></div>
        <div style="margin: 0.5rem 0;"><label>Email (optional)</label><input id="newUserEmail" style="width:100%; padding:0.55rem; margin-top:0.25rem;"/></div>
        <div id="adminModalMessage" style="color:#ff4444; font-size:0.85rem; margin:0.5rem 0; display:none;"></div>
        <div style="display:flex; gap:0.5rem; margin-top:0.75rem;"><button id="createAuthIdBtn" style="flex:1; padding:0.65rem; border:none; background:var(--accent-color); color:white;">Generate AUTH ID</button><button id="closeAdminModal" style="flex:1; padding:0.65rem; border:none; background:#777; color:white;">Close</button></div>
        <div id="authIdResult" style="margin-top:0.75rem; font-size:0.9rem; color:#20558c; display:none;"></div>
    `;

    modalOverlay.appendChild(card);
    document.body.appendChild(modalOverlay);

    document.getElementById('closeAdminModal').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });

    document.getElementById('createAuthIdBtn').addEventListener('click', () => {
        const name = document.getElementById('newUserName').value.trim();
        const role = document.getElementById('newUserRole').value.trim();
        const dept = document.getElementById('newUserDept').value.trim();
        const email = document.getElementById('newUserEmail').value.trim();
        const msg = document.getElementById('adminModalMessage');
        msg.style.display = 'none';

        if (!name) {
            msg.textContent = 'Name is required.';
            msg.style.display = 'block';
            return;
        }

        const authId = String(Math.floor(10000000 + Math.random() * 90000000));
        let ids = getApprovedAuthIds();
        ids.push(authId);
        saveApprovedAuthIds([...new Set(ids)]);

        const result = document.getElementById('authIdResult');
        result.innerHTML = `Auth ID created: <strong>${authId}</strong><br />Provide this to the new user.`;
        result.style.display = 'block';

        // Save metadata for admin tracking (optional)
        const meta = JSON.parse(localStorage.getItem('generatedAuthUsers') || '[]');
        meta.push({ authId, name, role, dept, email, createdAt: new Date().toISOString() });
        localStorage.setItem('generatedAuthUsers', JSON.stringify(meta));
    });
}

// Handle login form
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('errorMessage');
        btn.disabled = true;
        btn.textContent = 'Logging in...';
        errorDiv.style.display = 'none';

        const accessId = document.getElementById('accessId').value.trim();
        const idLast4 = document.getElementById('idLast4').value.trim();

        if (!/^[0-9]{8,12}$/.test(accessId)) {
            errorDiv.textContent = 'AuctionACCESS ID must be 8-12 digits.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Login';
            return;
        }

        if (!/^[0-9]{4}$/.test(idLast4)) {
            errorDiv.textContent = 'Last 4 digits must be numeric.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Login';
            return;
        }

        try {
            const success = await login(accessId, idLast4);
            if (success) {
                window.location.href = 'car-dashboard.html';
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    });
}

// Handle admin login form
if (document.getElementById('adminLoginBtn')) {
    document.getElementById('adminLoginBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        const adminId = document.getElementById('adminId').value.trim();
        const adminPassword = document.getElementById('adminPassword').value;
        const adminErrorDiv = document.getElementById('adminErrorMessage');
        adminErrorDiv.style.display = 'none';

        if (!adminId || !adminPassword) {
            adminErrorDiv.textContent = 'Admin ID and password are required.';
            adminErrorDiv.style.display = 'block';
            return;
        }

        try {
            const success = await adminLogin(adminId, adminPassword);
            if (success) {
                const stored = JSON.parse(localStorage.getItem('adminUsers') || '[]');
                const uid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
                if (uid && !stored.includes(uid)) {
                    stored.push(uid);
                    localStorage.setItem('adminUsers', JSON.stringify(stored));
                }
                window.location.href = 'car-dashboard.html';
            }
        } catch (error) {
            adminErrorDiv.textContent = error.message;
            adminErrorDiv.style.display = 'block';
        }
    });
}

// Handle signup form
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('signupBtn');
        const errorDiv = document.getElementById('errorMessage');
        btn.disabled = true;
        btn.textContent = 'Verifying...';
        errorDiv.style.display = 'none';

        const accessId = document.getElementById('accessId').value.trim();
        const idLast4 = document.getElementById('idLast4').value.trim();

        if (!/^[0-9]{8,12}$/.test(accessId)) {
            errorDiv.textContent = 'AuctionACCESS ID must be 8-12 digits.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'VERIFY MY IDENTITY';
            return;
        }

        if (!/^[0-9]{4}$/.test(idLast4)) {
            errorDiv.textContent = 'Last 4 digits must be numeric.';
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'VERIFY MY IDENTITY';
            return;
        }

        try {
            const success = await signup(accessId, idLast4);
            if (success) {
                window.location.href = 'profile-setup.html';
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'VERIFY MY IDENTITY';
        }
    });
}

// Handle logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});