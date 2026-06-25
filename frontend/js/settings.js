/**
 * Settings page — theme, currency, notifications
 */

function loadSettingsForm() {
  const settings = getSettings();

  const darkToggle = document.getElementById("setting-dark-mode");
  if (darkToggle) darkToggle.checked = settings.darkMode;

  const currency = document.getElementById("setting-currency");
  if (currency) {
    currency.innerHTML = CURRENCY_OPTIONS.map(
      (c) => `<option value="${c.code}" ${settings.currency === c.code ? "selected" : ""}>${c.code} (${c.symbol})</option>`
    ).join("");
  }

  const n = settings.notifications || {};
  document.getElementById("notif-email") && (document.getElementById("notif-email").checked = !!n.email);
  document.getElementById("notif-budget") && (document.getElementById("notif-budget").checked = !!n.budgetAlerts);
  document.getElementById("notif-weekly") && (document.getElementById("notif-weekly").checked = !!n.weeklyReport);
}

function saveSettingsFromForm() {
  const settings = getSettings();
  settings.darkMode = document.getElementById("setting-dark-mode")?.checked ?? settings.darkMode;
  settings.currency = document.getElementById("setting-currency")?.value || "INR";
  settings.notifications = {
    email: document.getElementById("notif-email")?.checked ?? true,
    budgetAlerts: document.getElementById("notif-budget")?.checked ?? true,
    weeklyReport: document.getElementById("notif-weekly")?.checked ?? false,
  };
  saveSettings(settings);
  applyTheme();
  syncDarkModeToggles();
  updateThemeIcons();
  showToast("Settings saved");
}

function initSettingsPage() {
  initApp("settings", "Settings", { subtitle: "Customize your app experience" });
  loadSettingsForm();

  document.getElementById("setting-dark-mode")?.addEventListener("change", (e) => {
    toggleDarkMode(e.target.checked);
    updateThemeIcons();
  });

  document.getElementById("settings-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveSettingsFromForm();
  });

  document.querySelectorAll(".setting-row input[type=checkbox]").forEach((el) => {
    el.addEventListener("change", saveSettingsFromForm);
  });

  document.getElementById("setting-currency")?.addEventListener("change", saveSettingsFromForm);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "settings") initSettingsPage();
});
