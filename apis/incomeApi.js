/**
 * Income API — CRUD operations (authenticated).
 */

import { BASE_URL, getAuthHeaders, parseJsonResponse } from "./apiConfig.js";

/**
 * Add a new income entry.
 * @param {Object} incomeData - e.g. { title, amount, source, date }
 * @returns {Promise<Object>}
 */
export async function addIncome(incomeData) {
  try {
    const response = await fetch(`${BASE_URL}/income`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(incomeData),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("addIncome error:", error);
    throw error;
  }
}

/**
 * Get all income entries for the logged-in user.
 * @returns {Promise<Object>}
 */
export async function getIncome() {
  try {
    const response = await fetch(`${BASE_URL}/income`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("getIncome error:", error);
    throw error;
  }
}

/**
 * Update an income entry by id.
 * @param {string|number} id
 * @param {Object} updatedData
 * @returns {Promise<Object>}
 */
export async function updateIncome(id, updatedData) {
  try {
    const response = await fetch(`${BASE_URL}/income/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedData),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("updateIncome error:", error);
    throw error;
  }
}

/**
 * Delete an income entry by id.
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function deleteIncome(id) {
  try {
    const response = await fetch(`${BASE_URL}/income/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("deleteIncome error:", error);
    throw error;
  }
}

// Example: await addIncome({ title: "Salary", amount: 3000, source: "Employer", date: "2026-05-01" });
// Example: const income = await getIncome();
// Example: await updateIncome("xyz789", { amount: 3200 });
// Example: await deleteIncome("xyz789");
