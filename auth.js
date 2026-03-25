// auth.js - Firebase Authentication

// Check if user is logged in (use Firebase auth state)
let currentUser = null;

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Login function
function login(email, password) {
    console.log('Attempting login for:', email);
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

// Signup function
function signup(name, email, password) {
    console.log('Attempting signup for:', email, 'with name:', name);
    return firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Signup successful, updating profile for:', userCredential.user.email);
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                console.log('Profile updated successfully');
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
    if (userNameEl) userNameEl.textContent = user.displayName || user.email;
    if (userAvatarEl) userAvatarEl.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.displayName || user.email}!`;
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
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const success = await login(email, password);
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

// Handle signup form
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('signupBtn');
        const errorDiv = document.getElementById('errorMessage');
        btn.disabled = true;
        btn.textContent = 'Signing up...';
        errorDiv.style.display = 'none';
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const success = await signup(name, email, password);
            if (success) {
                window.location.href = 'car-dashboard.html';
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sign Up';
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