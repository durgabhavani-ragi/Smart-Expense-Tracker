const USERS_KEY = "smartExp_users";
const SESSION_KEY = "smartExp_session";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, loggedInAt: Date.now() }));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function requireGuest() {
  if (getSession()?.email) {
    window.location.href = "dashboard.html";
  }
}

function requireAuth() {
  if (!getSession()?.email) {
    window.location.href = "login.html";
  }
}

function showAlert(containerId, message, type = "error") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function handleLogin(event) {
  event.preventDefault();
  clearAlert("auth-alert");

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showAlert("auth-alert", "Please enter email and password.");
    return;
  }

  const user = getUsers().find((u) => u.email === email && u.password === password);
  if (!user) {
    showAlert("auth-alert", "Invalid email or password.");
    return;
  }

  setSession(email);
  window.location.href = "dashboard.html";
}

function handleSignup(event) {
  event.preventDefault();
  clearAlert("auth-alert");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm-password").value;

  if (!name || !email || !password || !confirm) {
    showAlert("auth-alert", "Please fill in all fields.");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("auth-alert", "Please enter a valid email address.");
    return;
  }

  if (password.length < 6) {
    showAlert("auth-alert", "Password must be at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    showAlert("auth-alert", "Passwords do not match.");
    return;
  }

  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    showAlert("auth-alert", "An account with this email already exists.");
    return;
  }

  users.push({ name, email, password, phone: "", avatar: null });
  saveUsers(users);
  setSession(email);
  window.location.href = "dashboard.html";
}

function handleLogout() {
  clearSession();
  window.location.href = "login.html";
}
