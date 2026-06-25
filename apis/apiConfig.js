/**
 * Shared API configuration and auth headers helper.
 */

export const BASE_URL = "http://localhost:5000/api";

/** localStorage key for JWT after login */
export const TOKEN_KEY = "token";

/**
 * Returns headers for authenticated API requests.
 * @returns {Object} Headers with Content-Type and Authorization when token exists
 */
export function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Parses JSON and throws on non-OK responses.
 * @param {Response} response
 * @returns {Promise<Object>}
 */
export async function parseJsonResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    const message =
      data.message || data.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

// Example: import { BASE_URL, getAuthHeaders, TOKEN_KEY } from "./apiConfig.js";
// Example: const headers = getAuthHeaders();
