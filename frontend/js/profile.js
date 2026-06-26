/**
 * Profile page — user details, avatar, password
 */

import { getCurrentUser, updateCurrentUser } from "./auth.js";
import { initApp, showFormAlert, clearFormAlert, showToast, initUserHeader } from "./app.js";

function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;

  document.getElementById("profile-name").value = user.name || "";
  document.getElementById("profile-email").value = user.email || "";
  document.getElementById("profile-phone").value = user.phone || "";

  const avatar = document.getElementById("profile-avatar");
  if (avatar) {
    if (user.avatar) {
      avatar.innerHTML = `<img src="${user.avatar}" alt="Profile" />`;
    } else {
      avatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
    }
  }
}

function handleProfileSave(e) {
  e.preventDefault();
  const name = document.getElementById("profile-name").value.trim();
  const phone = document.getElementById("profile-phone").value.trim();

  if (!name) {
    showFormAlert("profile-alert", "Name is required.");
    return;
  }

  updateCurrentUser({ name, phone });
  initUserHeader();
  showFormAlert("profile-alert", "Profile updated successfully.", "success");
  showToast("Profile saved (local session only)");
}

function handleAvatarChange(e) {
  const file = e.target.files?.[0];
  if (!file || !file.type.startsWith("image/")) {
    showToast("Please select an image file", "error");
    return;
  }
  if (file.size > 500000) {
    showToast("Image must be under 500KB", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    updateCurrentUser({ avatar: reader.result });
    renderProfile();
    initUserHeader();
    showToast("Profile picture updated (local session only)");
  };
  reader.readAsDataURL(file);
}

function handlePasswordChange(e) {
  e.preventDefault();
  clearFormAlert("password-alert");

  const newPass = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-new-password").value;

  if (newPass.length < 6) {
    showFormAlert("password-alert", "New password must be at least 6 characters.");
    return;
  }
  if (newPass !== confirm) {
    showFormAlert("password-alert", "New passwords do not match.");
    return;
  }

  showFormAlert("password-alert", "Password changes require backend support and are not available yet.", "error");
}

async function initProfilePage() {
  await initApp("profile", "Profile", { subtitle: "Manage your account details" });
  renderProfile();

  const user = getCurrentUser();
  const nameEl = document.getElementById("profile-display-name");
  const emailEl = document.getElementById("profile-display-email");
  if (nameEl) nameEl.textContent = user?.name || "User";
  if (emailEl) emailEl.textContent = user?.email || "";

  document.getElementById("profile-form")?.addEventListener("submit", handleProfileSave);
  document.getElementById("password-form")?.addEventListener("submit", handlePasswordChange);
  document.getElementById("avatar-input")?.addEventListener("change", handleAvatarChange);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "profile") initProfilePage();
});
