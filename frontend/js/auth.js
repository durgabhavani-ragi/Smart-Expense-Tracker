/**
 * Authentication — JWT via backend REST API
 */

import { registerUser, loginUser, logoutUser } from "../apis/authApi.js";
import { BASE_URL, TOKEN_KEY, getAuthHeaders } from "../apis/apiConfig.js";

const USER_SESSION_KEY = "smartExp_user";
let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user || null;
  if (user) {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_SESSION_KEY);
  }
}

export function getCurrentUser() {
  if (currentUser) return currentUser;
  try {
    const stored = sessionStorage.getItem(USER_SESSION_KEY);
    currentUser = stored ? JSON.parse(stored) : null;
  } catch {
    currentUser = null;
  }
  return currentUser;
}

export function updateCurrentUser(updates) {
  const user = getCurrentUser();
  if (!user) return false;
  setCurrentUser({ ...user, ...updates });
  return true;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function validateToken() {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await fetch(`${BASE_URL}/expenses`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setCurrentUser(null);
      return false;
    }

    return response.ok;
  } catch {
    return false;
  }
}

export function requireGuest() {
  if (getToken()) {
    window.location.href = "dashboard.html";
  }
}

export async function requireAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }

  const valid = await validateToken();
  if (!valid) {
    window.location.href = "login.html";
    return false;
  }

  return true;
}

export function showAlert(containerId, message, type = "error") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

export function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function handleLogin(event) {
  event.preventDefault();
  clearAlert("auth-alert");

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const submitBtn = event.target.querySelector('button[type="submit"]');

  if (!email || !password) {
    showAlert("auth-alert", "Please enter email and password.");
    return;
  }

  if (submitBtn) submitBtn.disabled = true;

  try {
    const data = await loginUser({ email, password });
    if (data.data) setCurrentUser(data.data);
    window.location.href = "dashboard.html";
  } catch (error) {
    showAlert("auth-alert", error.message || "Login failed. Please try again.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

export async function handleSignup(event) {
  event.preventDefault();
  clearAlert("auth-alert");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm-password").value;
  const submitBtn = event.target.querySelector('button[type="submit"]');

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

  if (submitBtn) submitBtn.disabled = true;

  try {
    const data = await registerUser({ name, email, password });
    const token = data.token || data.jwt || data.accessToken;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (data.data) setCurrentUser(data.data);
    window.location.href = "dashboard.html";
  } catch (error) {
    showAlert("auth-alert", error.message || "Registration failed. Please try again.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

export async function handleLogout() {
  try {
    await logoutUser();
  } catch {
    localStorage.removeItem(TOKEN_KEY);
  }
  setCurrentUser(null);
  window.location.href = "login.html";
}
