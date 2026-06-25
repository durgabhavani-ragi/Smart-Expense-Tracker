/**
 * Analytics page — Chart.js visualizations
 */

function updateAnalyticsStats() {
  const transactions = getTransactions();
  const monthKey = getCurrentMonthKey();
  const income = getMonthlyIncome(transactions, monthKey);
  const expense = getMonthlyExpense(transactions, monthKey);
  const top = getTopCategory(transactions, monthKey);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("analytics-income", formatCurrency(income));
  set("analytics-expense", formatCurrency(expense));
  set("analytics-net", formatCurrency(income - expense));
  set("analytics-top-cat", `${top.category} (${formatCurrency(top.amount)})`);
}

function refreshAnalyticsCharts() {
  const transactions = getTransactions();
  const monthKey = getCurrentMonthKey();
  createCategoryPieChart("chart-categories", transactions, monthKey);
  createMonthlyBarChart("chart-monthly", transactions);
  createIncomeExpenseChart("chart-income-expense", transactions);
  createWeeklySpendingChart("chart-weekly", transactions);
}

function initAnalyticsPage() {
  initApp("analytics", "Analytics", { subtitle: "Visual insights into your spending patterns" });
  updateAnalyticsStats();
  refreshAnalyticsCharts();

  document.getElementById("month-filter")?.addEventListener("change", (e) => {
    const transactions = getTransactions();
    createCategoryPieChart("chart-categories", transactions, e.target.value || null);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "analytics") {
    const select = document.getElementById("month-filter");
    if (select) {
      getLastNMonths(12).reverse().forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = getMonthLabel(m);
        if (m === getCurrentMonthKey()) opt.selected = true;
        select.appendChild(opt);
      });
    }
    initAnalyticsPage();
  }
});

// Re-render charts when theme changes
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-dark-toggle]") && document.body.dataset.page === "analytics") {
    setTimeout(refreshAnalyticsCharts, 100);
  }
});
