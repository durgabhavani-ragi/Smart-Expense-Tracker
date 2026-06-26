/**
 * Authentication API — register, login, logout.
 */

import { BASE_URL, TOKEN_KEY, parseJsonResponse } from "./apiConfig.js";

/**
 * Register a new user.
 * @param {Object} userData - e.g. { name, email, password }
 * @returns {Promise<Object>} JSON response from server
 */
export async function registerUser(userData) {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("registerUser error:", error);
    throw error;
  }
}

/**
 * Log in and store JWT in localStorage.
 * @param {Object} userData - e.g. { email, password }
 * @returns {Promise<Object>} JSON response (often includes token)
 */
export async function loginUser(userData) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await parseJsonResponse(response);

    const token = data.token || data.jwt || data.accessToken;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }

    return data;
  } catch (error) {
    console.error("loginUser error:", error);
    throw error;
  }
}

/**
 * Log out — clears stored JWT.
 * @returns {Promise<Object|void>} JSON response if server logout endpoint exists
 */
export async function logoutUser() {
  try {
    localStorage.removeItem(TOKEN_KEY);

    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 404) {
      return { success: true, message: "Logged out locally" };
    }

    return await parseJsonResponse(response);
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    console.error("logoutUser error:", error);
    throw error;
  }
}

// Example: await registerUser({ name: "Jane", email: "jane@example.com", password: "secret123" });
// Example: await loginUser({ email: "jane@example.com", password: "secret123" });
// Example: await logoutUser();
