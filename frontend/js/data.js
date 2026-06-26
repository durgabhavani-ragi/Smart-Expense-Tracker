/**
 * Smart Expense Tracker — shared data layer (API + local preferences)
 */

import { getCurrentUser } from "./auth.js";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from "../apis/expenseApi.js";
import {
  getIncome,
  addIncome,
  updateIncome,
  deleteIncome,
} from "../apis/incomeApi.js";

const SETTINGS_PREFIX = "smartExp_settings_";
const BUDGET_PREFIX = "smartExp_budget_";

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

export const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", locale: "en-IN" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
];

let cachedTransactions = [];

function userKey(prefix) {
  const user = getCurrentUser();
  const key = user?.email || user?._id;
  return key ? prefix + key : null;
}

function toDateStr(dateVal) {
  if (!dateVal) return "";
  return new Date(dateVal).toISOString().split("T")[0];
}

function normalizeExpense(expense) {
  return {
    id: expense._id,
    type: "expense",
    amount: expense.amount,
    category: expense.category,
    date: toDateStr(expense.date),
    description: expense.description || expense.title || "",
    createdAt: new Date(expense.createdAt).getTime(),
  };
}

function normalizeIncome(income) {
  return {
    id: income._id,
    type: "income",
    amount: income.amount,
    category: "Income",
    date: toDateStr(income.date),
    description: income.description || income.source || "",
    createdAt: new Date(income.createdAt).getTime(),
  };
}

export async function loadTransactions() {
  const [expenseRes, incomeRes] = await Promise.all([getExpenses(), getIncome()]);
  const expenses = (expenseRes.data || []).map(normalizeExpense);
  const incomes = (incomeRes.data || []).map(normalizeIncome);
  cachedTransactions = [...expenses, ...incomes];
  return cachedTransactions;
}

export function getTransactions() {
  return cachedTransactions;
}

export async function createExpense({ amount, category, date, description }) {
  const payload = {
    title: description || category,
    description: description || "",
    amount,
    category,
    date,
  };
  const result = await addExpense(payload);
  if (result.data) {
    cachedTransactions.push(normalizeExpense(result.data));
  } else {
    await loadTransactions();
  }
  return cachedTransactions;
}

export async function createIncome({ amount, date, description }) {
  const payload = {
    source: description || "Income",
    description: description || "",
    amount,
    date,
  };
  const result = await addIncome(payload);
  if (result.data) {
    cachedTransactions.push(normalizeIncome(result.data));
  } else {
    await loadTransactions();
  }
  return cachedTransactions;
}

export async function deleteTransactionById(id) {
  const tx = cachedTransactions.find((t) => t.id === id);
  if (!tx) return cachedTransactions;

  if (tx.type === "expense") {
    await deleteExpense(id);
  } else {
    await deleteIncome(id);
  }

  cachedTransactions = cachedTransactions.filter((t) => t.id !== id);
  return cachedTransactions;
}

export async function upsertTransaction(record) {
  if (record.type === "expense") {
    await updateExpense(record.id, {
      title: record.description || record.category,
      description: record.description || "",
      amount: record.amount,
      category: record.category,
      date: record.date,
    });
  } else {
    await updateIncome(record.id, {
      source: record.description || "Income",
      description: record.description || "",
      amount: record.amount,
      date: record.date,
    });
  }

  const idx = cachedTransactions.findIndex((t) => t.id === record.id);
  if (idx >= 0) cachedTransactions[idx] = { ...record };
  return cachedTransactions;
}

function getDefaultSettings() {
  return {
    darkMode: false,
    currency: "INR",
    notifications: {
      email: true,
      budgetAlerts: true,
      weeklyReport: false,
    },
  };
}

export function getSettings() {
  const key = userKey(SETTINGS_PREFIX);
  if (!key) return getDefaultSettings();
  try {
    return { ...getDefaultSettings(), ...JSON.parse(localStorage.getItem(key)) };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings) {
  const key = userKey(SETTINGS_PREFIX);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(settings));
}

function getDefaultBudget() {
  const categoryBudgets = {};
  EXPENSE_CATEGORIES.forEach((c) => {
    categoryBudgets[c] = 0;
  });
  return {
    monthlyBudget: 0,
    categoryBudgets,
    savingsGoal: 0,
  };
}

export function getBudget() {
  const key = userKey(BUDGET_PREFIX);
  if (!key) return getDefaultBudget();
  try {
    const stored = JSON.parse(localStorage.getItem(key)) || {};
    return {
      ...getDefaultBudget(),
      ...stored,
      categoryBudgets: { ...getDefaultBudget().categoryBudgets, ...stored.categoryBudgets },
    };
  } catch {
    return getDefaultBudget();
  }
}

export function saveBudget(budget) {
  const key = userKey(BUDGET_PREFIX);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(budget));
}

export function getCurrencyMeta() {
  const code = getSettings().currency || "INR";
  return CURRENCY_OPTIONS.find((c) => c.code === code) || CURRENCY_OPTIONS[0];
}

export function formatCurrency(amount) {
  const meta = getCurrencyMeta();
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

export function getMonthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : "";
}

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function sumByType(transactions, type, monthKey) {
  return transactions
    .filter((t) => t.type === type && (!monthKey || getMonthKey(t.date) === monthKey))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyExpense(transactions, monthKey) {
  return sumByType(transactions, "expense", monthKey);
}

export function getMonthlyIncome(transactions, monthKey) {
  return sumByType(transactions, "income", monthKey);
}

export function getCategoryTotals(transactions, monthKey) {
  const totals = {};
  transactions
    .filter((t) => t.type === "expense" && (!monthKey || getMonthKey(t.date) === monthKey))
    .forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
  return totals;
}

export function getTopCategory(transactions, monthKey) {
  const totals = getCategoryTotals(transactions, monthKey);
  let top = { category: "—", amount: 0 };
  Object.entries(totals).forEach(([category, amount]) => {
    if (amount > top.amount) top = { category, amount };
  });
  return top;
}

export function getLastNMonths(n) {
  const months = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export function getMonthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function getWeeklySpending(transactions) {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const total = transactions
      .filter((t) => t.type === "expense" && t.date === key)
      .reduce((s, t) => s + t.amount, 0);
    days.push({ key, label, total });
  }
  return days;
}

export function getBudgetAlerts(transactions, budget) {
  const alerts = [];
  const monthKey = getCurrentMonthKey();
  const monthlySpent = getMonthlyExpense(transactions, monthKey);

  if (budget.monthlyBudget > 0) {
    const pct = (monthlySpent / budget.monthlyBudget) * 100;
    if (pct >= 100) {
      alerts.push({
        type: "danger",
        message: `Monthly budget exceeded by ${formatCurrency(monthlySpent - budget.monthlyBudget)}.`,
      });
    } else if (pct >= 80) {
      alerts.push({ type: "warning", message: `You've used ${pct.toFixed(0)}% of your monthly budget.` });
    }
  }

  const categoryTotals = getCategoryTotals(transactions, monthKey);
  Object.entries(budget.categoryBudgets || {}).forEach(([cat, limit]) => {
    if (limit > 0 && categoryTotals[cat] >= limit) {
      alerts.push({ type: "warning", message: `${cat} category budget reached.` });
    }
  });

  return alerts;
}

export function getSavingsProgress(transactions, budget) {
  const monthKey = getCurrentMonthKey();
  const income = getMonthlyIncome(transactions, monthKey);
  const expense = getMonthlyExpense(transactions, monthKey);
  const saved = Math.max(0, income - expense);
  const goal = budget.savingsGoal || 0;
  const pct = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;
  return { saved, goal, pct };
}

export function getRecentActivity(transactions, limit = 8) {
  return [...transactions]
    .filter((t) => t.type === "income" || t.type === "expense")
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);
}
