/**
 * Budget page — monthly & category budgets, alerts, savings goal
 */

import {
  EXPENSE_CATEGORIES,
  getTransactions,
  getBudget,
  saveBudget,
  getCurrentMonthKey,
  getCategoryTotals,
  getBudgetAlerts,
  getSavingsProgress,
  getMonthlyExpense,
  formatCurrency,
} from "./data.js";
import { initApp, showToast } from "./app.js";

function renderCategoryBudgetInputs() {
  const grid = document.getElementById("category-budget-grid");
  if (!grid) return;

  const budget = getBudget();
  const transactions = getTransactions();
  const monthKey = getCurrentMonthKey();
  const totals = getCategoryTotals(transactions, monthKey);

  grid.innerHTML = EXPENSE_CATEGORIES.map((cat) => {
    const limit = budget.categoryBudgets[cat] || 0;
    const spent = totals[cat] || 0;
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    return `
    <div class="category-budget-item">
      <label>${cat}</label>
      <input type="number" min="0" step="100" data-cat="${cat}" class="cat-budget-input" value="${limit || ""}" placeholder="Limit" />
      <div class="progress-block" style="margin-top:0.5rem">
        <div class="progress-label"><span>Spent ${formatCurrency(spent)}</span><span>${limit ? pct.toFixed(0) + "%" : "—"}</span></div>
        <div class="progress-bar"><div class="progress-fill ${pct >= 100 ? "danger" : pct >= 80 ? "warning" : ""}" style="width:${limit ? pct : 0}%"></div></div>
      </div>
    </div>`;
  }).join("");
}

function renderBudgetAlerts() {
  const container = document.getElementById("budget-alerts");
  if (!container) return;

  const alerts = getBudgetAlerts(getTransactions(), getBudget());
  if (!alerts.length) {
    container.innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-shield-heart"></i> All budgets are within limits.</div>`;
    return;
  }
  container.innerHTML = alerts
    .map((a) => `<div class="alert alert-${a.type === "danger" ? "error" : "warning"}"><i class="fa-solid fa-bell"></i> ${a.message}</div>`)
    .join("");
}

function updateSavingsTracker() {
  const budget = getBudget();
  const savings = getSavingsProgress(getTransactions(), budget);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("savings-current", formatCurrency(savings.saved));
  set("savings-goal-display", formatCurrency(budget.savingsGoal || 0));

  const bar = document.getElementById("savings-goal-progress");
  if (bar) bar.style.width = `${savings.pct}%`;

  const monthly = getMonthlyExpense(getTransactions(), getCurrentMonthKey());
  const monthlyBudget = budget.monthlyBudget || 0;
  set("monthly-budget-spent", formatCurrency(monthly));
  set("monthly-budget-total", formatCurrency(monthlyBudget));

  const mb = document.getElementById("monthly-budget-progress");
  if (mb && monthlyBudget > 0) {
    const pct = Math.min(100, (monthly / monthlyBudget) * 100);
    mb.style.width = `${pct}%`;
    mb.classList.toggle("warning", pct >= 80 && pct < 100);
    mb.classList.toggle("danger", pct >= 100);
  }
}

function handleBudgetSave(e) {
  e.preventDefault();
  const budget = getBudget();

  budget.monthlyBudget = parseFloat(document.getElementById("monthly-budget").value) || 0;
  budget.savingsGoal = parseFloat(document.getElementById("savings-goal").value) || 0;

  document.querySelectorAll(".cat-budget-input").forEach((input) => {
    const cat = input.dataset.cat;
    budget.categoryBudgets[cat] = parseFloat(input.value) || 0;
  });

  saveBudget(budget);
  renderCategoryBudgetInputs();
  renderBudgetAlerts();
  updateSavingsTracker();
  showToast("Budget saved successfully");
}

async function initBudgetPage() {
  await initApp("budget", "Budget", { subtitle: "Plan spending and track savings goals" });

  const budget = getBudget();
  document.getElementById("monthly-budget").value = budget.monthlyBudget || "";
  document.getElementById("savings-goal").value = budget.savingsGoal || "";

  renderCategoryBudgetInputs();
  renderBudgetAlerts();
  updateSavingsTracker();

  document.getElementById("budget-form")?.addEventListener("submit", handleBudgetSave);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "budget") initBudgetPage();
});
