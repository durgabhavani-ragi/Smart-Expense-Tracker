/**
 * Smart Expense Tracker — shared data layer (localStorage)
 * Used across dashboard, analytics, transactions, budget, profile, settings.
 */

const TRANSACTIONS_PREFIX = "smartExp_transactions_";
const SETTINGS_PREFIX = "smartExp_settings_";
const BUDGET_PREFIX = "smartExp_budget_";

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", locale: "en-IN" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
];

function userKey(prefix) {
  const email = getSession()?.email;
  return email ? prefix + email : null;
}

function getTransactions() {
  const key = userKey(TRANSACTIONS_PREFIX);
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveTransactions(list) {
  const key = userKey(TRANSACTIONS_PREFIX);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(list));
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

function getSettings() {
  const key = userKey(SETTINGS_PREFIX);
  if (!key) return getDefaultSettings();
  try {
    return { ...getDefaultSettings(), ...JSON.parse(localStorage.getItem(key)) };
  } catch {
    return getDefaultSettings();
  }
}

function saveSettings(settings) {
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

function getBudget() {
  const key = userKey(BUDGET_PREFIX);
  if (!key) return getDefaultBudget();
  try {
    const stored = JSON.parse(localStorage.getItem(key)) || {};
    return { ...getDefaultBudget(), ...stored, categoryBudgets: { ...getDefaultBudget().categoryBudgets, ...stored.categoryBudgets } };
  } catch {
    return getDefaultBudget();
  }
}

function saveBudget(budget) {
  const key = userKey(BUDGET_PREFIX);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(budget));
}

function getCurrencyMeta() {
  const code = getSettings().currency || "INR";
  return CURRENCY_OPTIONS.find((c) => c.code === code) || CURRENCY_OPTIONS[0];
}

function formatCurrency(amount) {
  const meta = getCurrencyMeta();
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function getCurrentUser() {
  const session = getSession();
  if (!session?.email) return null;
  return getUsers().find((u) => u.email === session.email) || null;
}

function updateCurrentUser(updates) {
  const session = getSession();
  if (!session?.email) return false;
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === session.email);
  if (idx === -1) return false;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return true;
}

function getMonthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : "";
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function sumByType(transactions, type, monthKey) {
  return transactions
    .filter((t) => t.type === type && (!monthKey || getMonthKey(t.date) === monthKey))
    .reduce((sum, t) => sum + t.amount, 0);
}

function getMonthlyExpense(transactions, monthKey) {
  return sumByType(transactions, "expense", monthKey);
}

function getMonthlyIncome(transactions, monthKey) {
  return sumByType(transactions, "income", monthKey);
}

function getCategoryTotals(transactions, monthKey) {
  const totals = {};
  transactions
    .filter((t) => t.type === "expense" && (!monthKey || getMonthKey(t.date) === monthKey))
    .forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
  return totals;
}

function getTopCategory(transactions, monthKey) {
  const totals = getCategoryTotals(transactions, monthKey);
  let top = { category: "—", amount: 0 };
  Object.entries(totals).forEach(([category, amount]) => {
    if (amount > top.amount) top = { category, amount };
  });
  return top;
}

function getLastNMonths(n) {
  const months = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function getMonthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function getWeeklySpending(transactions) {
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

function getBudgetAlerts(transactions, budget) {
  const alerts = [];
  const monthKey = getCurrentMonthKey();
  const monthlySpent = getMonthlyExpense(transactions, monthKey);

  if (budget.monthlyBudget > 0) {
    const pct = (monthlySpent / budget.monthlyBudget) * 100;
    if (pct >= 100) {
      alerts.push({ type: "danger", message: `Monthly budget exceeded by ${formatCurrency(monthlySpent - budget.monthlyBudget)}.` });
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

function getSavingsProgress(transactions, budget) {
  const monthKey = getCurrentMonthKey();
  const income = getMonthlyIncome(transactions, monthKey);
  const expense = getMonthlyExpense(transactions, monthKey);
  const saved = Math.max(0, income - expense);
  const goal = budget.savingsGoal || 0;
  const pct = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;
  return { saved, goal, pct };
}

function addActivityLog(type, message) {
  const list = getTransactions();
  list.push({
    id: generateId(),
    type: "activity",
    activityType: type,
    description: message,
    date: new Date().toISOString().split("T")[0],
    createdAt: Date.now(),
    amount: 0,
    category: "System",
  });
  saveTransactions(list);
}

function getRecentActivity(transactions, limit = 8) {
  return [...transactions]
    .filter((t) => t.type !== "activity" || t.activityType)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);
}

function deleteTransactionById(id) {
  const list = getTransactions().filter((t) => t.id !== id);
  saveTransactions(list);
  return list;
}

function upsertTransaction(record) {
  const list = getTransactions();
  const idx = list.findIndex((t) => t.id === record.id);
  if (idx >= 0) list[idx] = record;
  else list.push(record);
  saveTransactions(list);
  return list;
}
