/**
 * Dashboard page logic
 */

import { getCurrentUser } from "./auth.js";
import {
  EXPENSE_CATEGORIES,
  getTransactions,
  getBudget,
  getCurrentMonthKey,
  getMonthlyExpense,
  getMonthlyIncome,
  getTopCategory,
  getSavingsProgress,
  getBudgetAlerts,
  createExpense,
  createIncome,
  formatCurrency,
  formatDate,
  formatDateTime,
  escapeHtml,
} from "./data.js";
import { initApp, showToast, showFormAlert, clearFormAlert } from "./app.js";
import { createCategoryPieChart, createWeeklySpendingChart } from "./charts.js";

function renderRecentTransactions(limit = 5) {
  const list = document.getElementById("recent-transactions");
  if (!list) return;

  const items = getTransactions()
    .filter((t) => t.type === "income" || t.type === "expense")
    .sort((a, b) => new Date(b.date) - new Date(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);

  if (!items.length) {
    list.innerHTML = `<li class="empty-state"><i class="fa-solid fa-receipt"></i><p>No transactions yet</p></li>`;
    return;
  }

  list.innerHTML = items
    .map((t) => {
      const isIncome = t.type === "income";
      return `
      <li>
        <div class="tx-icon ${isIncome ? "income" : "expense"}" style="background:var(${isIncome ? "--success-bg" : "--danger-bg"})">
          <i class="fa-solid ${isIncome ? "fa-arrow-down" : "fa-arrow-up"}"></i>
        </div>
        <div>
          <strong>${escapeHtml(t.description || t.category)}</strong>
          <span>${formatDate(t.date)} · ${escapeHtml(t.category)}</span>
        </div>
        <span class="timeline-amount ${isIncome ? "income" : "expense"}">
          ${isIncome ? "+" : "-"}${formatCurrency(t.amount)}
        </span>
      </li>`;
    })
    .join("");
}

function renderActivityTimeline() {
  const list = document.getElementById("activity-timeline");
  if (!list) return;

  const items = getTransactions()
    .filter((t) => t.type === "income" || t.type === "expense")
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 6);

  if (!items.length) {
    list.innerHTML = `<li class="empty-state"><p>No recent activity</p></li>`;
    return;
  }

  list.innerHTML = items
    .map((t) => {
      const isIncome = t.type === "income";
      return `
      <li>
        <div class="timeline-icon ${isIncome ? "income" : "expense"}">
          <i class="fa-solid ${isIncome ? "fa-wallet" : "fa-cart-shopping"}"></i>
        </div>
        <div class="timeline-body">
          <strong>${isIncome ? "Income" : "Expense"}: ${escapeHtml(t.description || t.category)}</strong>
          <span>${formatDateTime(t.createdAt)}</span>
        </div>
        <span class="timeline-amount ${isIncome ? "income" : "expense"}">
          ${isIncome ? "+" : "-"}${formatCurrency(t.amount)}
        </span>
      </li>`;
    })
    .join("");
}

function updateDashboardStats() {
  const transactions = getTransactions();
  const monthKey = getCurrentMonthKey();
  const budget = getBudget();

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const monthlyExpense = getMonthlyExpense(transactions, monthKey);
  const monthlyIncome = getMonthlyIncome(transactions, monthKey);
  const top = getTopCategory(transactions, monthKey);
  const savings = getSavingsProgress(transactions, budget);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("total-income", formatCurrency(totalIncome));
  set("total-expense", formatCurrency(totalExpense));
  set("balance", formatCurrency(balance));
  set("monthly-spent", formatCurrency(monthlyExpense));
  set("monthly-income", formatCurrency(monthlyIncome));
  set("net-month", formatCurrency(monthlyIncome - monthlyExpense));
  set("top-category", top.category);
  set("top-category-amount", formatCurrency(top.amount));
  set("savings-amount", formatCurrency(savings.saved));
  set("savings-goal-text", budget.savingsGoal > 0 ? `of ${formatCurrency(budget.savingsGoal)} goal` : "Set a goal in Budget");

  const balanceEl = document.getElementById("balance");
  balanceEl?.classList.toggle("negative", balance < 0);

  const progress = document.getElementById("savings-progress");
  if (progress) {
    progress.style.width = `${savings.pct}%`;
    progress.classList.toggle("warning", savings.pct >= 70 && savings.pct < 100);
    progress.classList.toggle("danger", savings.pct >= 100);
  }

  const budgetPct = budget.monthlyBudget > 0 ? (monthlyExpense / budget.monthlyBudget) * 100 : 0;
  const budgetProgress = document.getElementById("budget-progress");
  if (budgetProgress) {
    budgetProgress.style.width = `${Math.min(100, budgetPct)}%`;
    budgetProgress.classList.toggle("warning", budgetPct >= 70 && budgetPct < 100);
    budgetProgress.classList.toggle("danger", budgetPct >= 100);
  }
  set("budget-used-pct", budget.monthlyBudget > 0 ? `${budgetPct.toFixed(0)}% used` : "No budget set");

  renderBudgetAlertsMini();
}

function renderBudgetAlertsMini() {
  const container = document.getElementById("budget-alerts-mini");
  if (!container) return;
  const alerts = getBudgetAlerts(getTransactions(), getBudget());
  if (!alerts.length) {
    container.innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> On track this month</div>`;
    return;
  }
  container.innerHTML = alerts
    .slice(0, 2)
    .map((a) => `<div class="alert alert-${a.type === "danger" ? "error" : "warning"}"><i class="fa-solid fa-triangle-exclamation"></i> ${a.message}</div>`)
    .join("");
}

async function handleAddExpense(event) {
  event.preventDefault();
  clearFormAlert("expense-alert");

  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = document.getElementById("expense-category").value;
  const date = document.getElementById("expense-date").value;
  const description = document.getElementById("expense-description").value.trim();

  if (!amount || amount <= 0) {
    showFormAlert("expense-alert", "Enter a valid amount greater than 0.");
    return;
  }
  if (!category || !date) {
    showFormAlert("expense-alert", "Category and date are required.");
    return;
  }

  try {
    await createExpense({ amount, category, date, description });
    event.target.reset();
    setDefaultDates();
    refreshDashboard();
    showFormAlert("expense-alert", "Expense added successfully.", "success");
    showToast("Expense recorded");
  } catch (error) {
    showFormAlert("expense-alert", error.message || "Failed to add expense.");
  }
}

async function handleAddIncome(event) {
  event.preventDefault();
  clearFormAlert("income-alert");

  const amount = parseFloat(document.getElementById("income-amount").value);
  const date = document.getElementById("income-date").value;
  const description = document.getElementById("income-description").value.trim();

  if (!amount || amount <= 0) {
    showFormAlert("income-alert", "Enter a valid amount greater than 0.");
    return;
  }
  if (!date) {
    showFormAlert("income-alert", "Date is required.");
    return;
  }

  try {
    await createIncome({ amount, date, description: description || "Income" });
    event.target.reset();
    setDefaultDates();
    refreshDashboard();
    showFormAlert("income-alert", "Income added successfully.", "success");
    showToast("Income recorded");
  } catch (error) {
    showFormAlert("income-alert", error.message || "Failed to add income.");
  }
}

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  ["expense-date", "income-date"].forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = today;
  });
}

function populateExpenseCategorySelect() {
  const select = document.getElementById("expense-category");
  if (!select) return;
  select.innerHTML = EXPENSE_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function refreshDashboard() {
  updateDashboardStats();
  renderRecentTransactions();
  renderActivityTimeline();
  const transactions = getTransactions();
  const monthKey = getCurrentMonthKey();
  createCategoryPieChart("chart-category-mini", transactions, monthKey);
  createWeeklySpendingChart("chart-weekly-mini", transactions);
}

async function initDashboardPage() {
  const user = getCurrentUser();
  const subtitle = `Here's your financial overview, ${user?.name?.split(" ")[0] || "there"}`;
  await initApp("dashboard", "Dashboard", { subtitle, showAddButton: true });

  populateExpenseCategorySelect();
  setDefaultDates();
  refreshDashboard();

  document.getElementById("expense-form")?.addEventListener("submit", handleAddExpense);
  document.getElementById("income-form")?.addEventListener("submit", handleAddIncome);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "dashboard") {
    initDashboardPage();
  }
});
