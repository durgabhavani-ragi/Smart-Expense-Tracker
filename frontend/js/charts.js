/**
 * Smart Expense Tracker — Chart.js helpers
 */

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

let chartInstances = {};

function getChartColors() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    text: isDark ? "#94a3b8" : "#64748b",
    grid: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(148, 163, 184, 0.25)",
    surface: isDark ? "#1e293b" : "#ffffff",
  };
}

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function destroyAllCharts() {
  Object.keys(chartInstances).forEach(destroyChart);
}

function baseOptions() {
  const colors = getChartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: colors.text, font: { family: "'DM Sans', sans-serif", size: 12 } },
      },
    },
    scales: {},
  };
}

function createCategoryPieChart(canvasId, transactions, monthKey) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const totals = getCategoryTotals(transactions, monthKey);
  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const colors = getChartColors();

  if (!labels.length) {
    chartInstances[canvasId] = new Chart(canvas, {
      type: "doughnut",
      data: { labels: ["No data"], datasets: [{ data: [1], backgroundColor: ["#334155"] }] },
      options: { ...baseOptions(), plugins: { legend: { display: false } } },
    });
    return;
  }

  chartInstances[canvasId] = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...baseOptions(),
      cutout: "65%",
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function createMonthlyBarChart(canvasId, transactions) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const months = getLastNMonths(6);
  const data = months.map((m) => getMonthlyExpense(transactions, m));
  const colors = getChartColors();

  chartInstances[canvasId] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: months.map(getMonthLabel),
      datasets: [{
        label: "Expenses",
        data,
        backgroundColor: "rgba(59, 130, 246, 0.85)",
        borderRadius: 8,
        maxBarThickness: 48,
      }],
    },
    options: {
      ...baseOptions(),
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: colors.text }, grid: { display: false } },
        y: {
          ticks: { color: colors.text, callback: (v) => formatCurrency(v) },
          grid: { color: colors.grid },
          beginAtZero: true,
        },
      },
    },
  });
}

function createIncomeExpenseChart(canvasId, transactions) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const months = getLastNMonths(6);
  const income = months.map((m) => getMonthlyIncome(transactions, m));
  const expense = months.map((m) => getMonthlyExpense(transactions, m));
  const colors = getChartColors();

  chartInstances[canvasId] = new Chart(canvas, {
    type: "line",
    data: {
      labels: months.map(getMonthLabel),
      datasets: [
        {
          label: "Income",
          data: income,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          fill: true,
          tension: 0.35,
        },
        {
          label: "Expense",
          data: expense,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      ...baseOptions(),
      scales: {
        x: { ticks: { color: colors.text }, grid: { display: false } },
        y: {
          ticks: { color: colors.text },
          grid: { color: colors.grid },
          beginAtZero: true,
        },
      },
    },
  });
}

function createWeeklySpendingChart(canvasId, transactions) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const week = getWeeklySpending(transactions);
  const colors = getChartColors();

  chartInstances[canvasId] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: week.map((d) => d.label),
      datasets: [{
        label: "Daily spending",
        data: week.map((d) => d.total),
        backgroundColor: "rgba(139, 92, 246, 0.85)",
        borderRadius: 6,
      }],
    },
    options: {
      ...baseOptions(),
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: colors.text }, grid: { display: false } },
        y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true },
      },
    },
  });
}

function refreshAllChartsOnPage(configs) {
  configs.forEach(({ id, fn, args }) => fn(id, ...args));
}
