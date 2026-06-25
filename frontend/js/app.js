/**
 * Smart Expense Tracker — shared layout, theme, navigation
 */

const NAV_ITEMS = [
  { href: "dashboard.html", icon: "fa-gauge-high", label: "Dashboard", page: "dashboard" },
  { href: "analytics.html", icon: "fa-chart-pie", label: "Analytics", page: "analytics" },
  { href: "transactions.html", icon: "fa-arrow-right-arrow-left", label: "Transactions", page: "transactions" },
  { href: "budget.html", icon: "fa-wallet", label: "Budget", page: "budget" },
  { href: "profile.html", icon: "fa-user", label: "Profile", page: "profile" },
  { href: "settings.html", icon: "fa-gear", label: "Settings", page: "settings" },
];

function applyTheme() {
  const settings = getSettings();
  document.documentElement.setAttribute("data-theme", settings.darkMode ? "dark" : "light");
}

function toggleDarkMode(force) {
  const settings = getSettings();
  settings.darkMode = typeof force === "boolean" ? force : !settings.darkMode;
  saveSettings(settings);
  applyTheme();
  syncDarkModeToggles();
  return settings.darkMode;
}

function syncDarkModeToggles() {
  const isDark = getSettings().darkMode;
  document.querySelectorAll("[data-dark-toggle]").forEach((el) => {
    if (el.type === "checkbox") el.checked = isDark;
    el.setAttribute("aria-pressed", String(isDark));
  });
  const settingDark = document.getElementById("setting-dark-mode");
  if (settingDark) settingDark.checked = isDark;
}

function renderSidebar(activePage) {
  const navHtml = NAV_ITEMS.map(
    (item) => `
    <li>
      <a href="${item.href}" class="${item.page === activePage ? "active" : ""}">
        <i class="fa-solid ${item.icon}" aria-hidden="true"></i>
        <span>${item.label}</span>
      </a>
    </li>`
  ).join("");

  return `
    <aside class="sidebar" id="sidebar" aria-label="Main navigation">
      <div class="sidebar-brand">
        <div class="brand-icon"><i class="fa-solid fa-coins"></i></div>
        <div>
          <h2>Smart Expense</h2>
          <span>Personal finance</span>
        </div>
      </div>
      <ul class="sidebar-nav">${navHtml}</ul>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar-sm" id="sidebar-avatar"><i class="fa-solid fa-user"></i></div>
          <div>
            <p class="user-name" id="sidebar-user-name">User</p>
            <p class="user-email" id="user-email"></p>
          </div>
        </div>
        <button type="button" class="btn btn-logout" id="logout-btn">
          <i class="fa-solid fa-right-from-bracket"></i> Log Out
        </button>
      </div>
    </aside>`;
}

function renderTopbar(title, options = {}) {
  const showAdd = options.showAddButton;
  return `
    <header class="topbar">
      <div class="topbar-left">
        <button type="button" class="menu-toggle" id="menu-toggle" aria-label="Open menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div>
          <h1>${escapeHtml(title)}</h1>
          ${options.subtitle ? `<p class="topbar-subtitle">${escapeHtml(options.subtitle)}</p>` : ""}
        </div>
      </div>
      <div class="topbar-actions">
        <button type="button" class="icon-btn" id="theme-toggle-top" data-dark-toggle aria-label="Toggle dark mode">
          <i class="fa-solid fa-moon"></i>
        </button>
        ${showAdd ? `<a href="transactions.html#add" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> Add</a>` : ""}
      </div>
    </header>`;
}

function injectAppShell(activePage, title, options = {}) {
  const shell = document.getElementById("app-shell");
  if (!shell) return;

  shell.innerHTML = `
    ${renderSidebar(activePage)}
    <div class="overlay" id="overlay" aria-hidden="true"></div>
    <div class="main-content">
      ${renderTopbar(title, options)}
      <main class="page-content" id="page-main"></main>
    </div>`;

  const main = document.getElementById("page-main");
  const content = document.getElementById("page-content");
  if (main && content) {
    main.appendChild(content);
    content.hidden = false;
  }
}

function initSidebar() {
  const toggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  toggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
    overlay?.classList.toggle("active");
  });

  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("active");
  });

  document.querySelectorAll(".sidebar-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      sidebar?.classList.remove("open");
      overlay?.classList.remove("active");
    });
  });
}

function initThemeControls() {
  document.querySelectorAll("[data-dark-toggle]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (el.type === "checkbox") return;
      e.preventDefault();
      toggleDarkMode();
      updateThemeIcons();
    });
    if (el.type === "checkbox") {
      el.addEventListener("change", () => toggleDarkMode(el.checked));
    }
  });
  syncDarkModeToggles();
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = getSettings().darkMode;
  document.querySelectorAll("#theme-toggle-top i, [data-theme-icon]").forEach((icon) => {
    icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  });
}

function initUserHeader() {
  const session = getSession();
  const user = getCurrentUser();
  const displayName = user?.name || session?.email || "User";

  const emailEl = document.getElementById("user-email");
  if (emailEl) emailEl.textContent = session?.email || "";

  const nameEl = document.getElementById("sidebar-user-name");
  if (nameEl) nameEl.textContent = displayName;

  const avatarEl = document.getElementById("sidebar-avatar");
  if (avatarEl && user?.avatar) {
    avatarEl.innerHTML = `<img src="${user.avatar}" alt="" />`;
  }
}

function initApp(activePage, title, options = {}) {
  requireAuth();
  applyTheme();
  injectAppShell(activePage, title, options);
  initSidebar();
  initThemeControls();
  initUserHeader();
  document.getElementById("logout-btn")?.addEventListener("click", handleLogout);
}

function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function showFormAlert(id, message, type = "error") {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}"><i class="fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}"></i> ${message}</div>`;
}

function clearFormAlert(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = "";
}
