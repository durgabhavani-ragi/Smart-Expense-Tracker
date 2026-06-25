/**
 * Expense API — CRUD operations (authenticated).
 */

import { BASE_URL, getAuthHeaders, parseJsonResponse } from "./apiConfig.js";

/**
 * Add a new expense.
 * @param {Object} expenseData - e.g. { title, amount, category, date }
 * @returns {Promise<Object>}
 */
export async function addExpense(expenseData) {
  try {
    const response = await fetch(`${BASE_URL}/expenses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(expenseData),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("addExpense error:", error);
    throw error;
  }
}

/**
 * Get all expenses for the logged-in user.
 * @returns {Promise<Object>}
 */
export async function getExpenses() {
  try {
    const response = await fetch(`${BASE_URL}/expenses`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("getExpenses error:", error);
    throw error;
  }
}

/**
 * Update an expense by id.
 * @param {string|number} id
 * @param {Object} updatedData
 * @returns {Promise<Object>}
 */
export async function updateExpense(id, updatedData) {
  try {
    const response = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedData),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("updateExpense error:", error);
    throw error;
  }
}

/**
 * Delete an expense by id.
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function deleteExpense(id) {
  try {
    const response = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("deleteExpense error:", error);
    throw error;
  }
}

// Example: await addExpense({ title: "Groceries", amount: 45.5, category: "Food", date: "2026-05-25" });
// Example: const expenses = await getExpenses();
// Example: await updateExpense("abc123", { amount: 50 });
// Example: await deleteExpense("abc123");
