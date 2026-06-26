/**
 * Transactions page — search, filter, sort, edit, delete
 */

import {
  EXPENSE_CATEGORIES,
  getTransactions,
  createExpense,
  createIncome,
  deleteTransactionById,
  upsertTransaction,
  formatCurrency,
  formatDate,
  escapeHtml,
} from "./data.js";
import { initApp, showToast } from "./app.js";

let sortField = "date";
let sortDir = "desc";
let editingId = null;

function populateFilters() {
  const cat = document.getElementById("tx-category-filter");
  const type = document.getElementById("tx-type-filter");
  if (cat) {
    cat.innerHTML =
      '<option value="">All categories</option>' +
      EXPENSE_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("") +
      '<option value="Income">Income</option>';
  }
  if (type) {
    type.innerHTML = `
      <option value="">All types</option>
      <option value="expense">Expense</option>
      <option value="income">Income</option>`;
  }
}

function getFilteredTransactions() {
  const search = (document.getElementById("tx-search")?.value || "").toLowerCase();
  const category = document.getElementById("tx-category-filter")?.value || "";
  const type = document.getElementById("tx-type-filter")?.value || "";

  let list = getTransactions().filter((t) => t.type === "income" || t.type === "expense");

  if (search) {
    list = list.filter(
      (t) =>
        (t.description || "").toLowerCase().includes(search) ||
        (t.category || "").toLowerCase().includes(search)
    );
  }
  if (category) list = list.filter((t) => t.category === category);
  if (type) list = list.filter((t) => t.type === type);

  list.sort((a, b) => {
    let cmp = 0;
    if (sortField === "amount") cmp = a.amount - b.amount;
    else cmp = new Date(a.date) - new Date(b.date);
    return sortDir === "asc" ? cmp : -cmp;
  });

  return list;
}

function renderTransactionsTable() {
  const tbody = document.getElementById("transactions-body");
  const empty = document.getElementById("transactions-empty");
  if (!tbody) return;

  const items = getFilteredTransactions();
  tbody.innerHTML = "";

  if (!items.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  tbody.innerHTML = items
    .map((t) => {
      const isIncome = t.type === "income";
      return `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td><span class="badge badge-${isIncome ? "income" : "expense"}">${escapeHtml(t.category)}</span></td>
        <td>${escapeHtml(t.description || "—")}</td>
        <td><span class="badge badge-${isIncome ? "income" : "expense"}">${isIncome ? "Income" : "Expense"}</span></td>
        <td><strong class="${isIncome ? "change up" : "change down"}">${formatCurrency(t.amount)}</strong></td>
        <td>
          <div class="action-btns">
            <button type="button" class="btn-icon-sm btn-edit" data-id="${t.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="btn-icon-sm danger btn-delete" data-id="${t.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteTx(btn.dataset.id));
  });
  tbody.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });
}

async function deleteTx(id) {
  if (!confirm("Delete this transaction?")) return;
  try {
    await deleteTransactionById(id);
    renderTransactionsTable();
    showToast("Transaction deleted");
  } catch (error) {
    showToast(error.message || "Failed to delete transaction", "error");
  }
}

function openEditModal(id) {
  const t = getTransactions().find((x) => x.id === id);
  if (!t) return;
  editingId = id;

  document.getElementById("edit-type").value = t.type;
  document.getElementById("edit-amount").value = t.amount;
  document.getElementById("edit-date").value = t.date;
  document.getElementById("edit-description").value = t.description || "";
  populateEditCategories(t.type, t.category);

  document.getElementById("edit-modal").classList.add("active");
}

function closeEditModal() {
  editingId = null;
  document.getElementById("edit-modal")?.classList.remove("active");
}

function populateEditCategories(type, selected) {
  const select = document.getElementById("edit-category");
  if (!select) return;
  if (type === "income") {
    select.innerHTML = '<option value="Income">Income</option>';
    select.disabled = true;
  } else {
    select.disabled = false;
    select.innerHTML = EXPENSE_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
  }
  select.value = selected || (type === "income" ? "Income" : EXPENSE_CATEGORIES[0]);
}

async function handleEditSubmit(e) {
  e.preventDefault();
  if (!editingId) return;

  const type = document.getElementById("edit-type").value;
  const amount = parseFloat(document.getElementById("edit-amount").value);
  const date = document.getElementById("edit-date").value;
  const category = document.getElementById("edit-category").value;
  const description = document.getElementById("edit-description").value.trim();

  if (!amount || amount <= 0 || !date) {
    showToast("Invalid amount or date", "error");
    return;
  }

  const record = {
    id: editingId,
    type,
    amount,
    date,
    category: type === "income" ? "Income" : category,
    description,
    createdAt: getTransactions().find((t) => t.id === editingId)?.createdAt || Date.now(),
  };

  try {
    await upsertTransaction(record);
    closeEditModal();
    renderTransactionsTable();
    showToast("Transaction updated");
  } catch (error) {
    showToast(error.message || "Failed to update transaction", "error");
  }
}

function initSortHeaders() {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (sortField === field) sortDir = sortDir === "asc" ? "desc" : "asc";
      else {
        sortField = field;
        sortDir = "desc";
      }
      document.querySelectorAll("th[data-sort]").forEach((h) => h.classList.remove("sorted"));
      th.classList.add("sorted");
      renderTransactionsTable();
    });
  });
}

async function handleQuickAdd(e) {
  e.preventDefault();
  const type = document.getElementById("quick-type").value;
  const amount = parseFloat(document.getElementById("quick-amount").value);
  const date = document.getElementById("quick-date").value;
  const category = document.getElementById("quick-category").value;
  const description = document.getElementById("quick-description").value.trim();

  if (!amount || amount <= 0 || !date) {
    showToast("Fill required fields", "error");
    return;
  }

  try {
    if (type === "income") {
      await createIncome({ amount, date, description: description || "Income" });
    } else {
      await createExpense({
        amount,
        category,
        date,
        description: description || category,
      });
    }
    e.target.reset();
    document.getElementById("quick-date").value = new Date().toISOString().split("T")[0];
    renderTransactionsTable();
    showToast("Transaction added");
  } catch (error) {
    showToast(error.message || "Failed to add transaction", "error");
  }
}

async function initTransactionsPage() {
  await initApp("transactions", "Transactions", { subtitle: "Search, filter, and manage all entries" });

  populateFilters();
  document.getElementById("quick-date").value = new Date().toISOString().split("T")[0];
  const quickCat = document.getElementById("quick-category");
  if (quickCat) quickCat.innerHTML = EXPENSE_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");

  document.getElementById("tx-search")?.addEventListener("input", renderTransactionsTable);
  document.getElementById("tx-category-filter")?.addEventListener("change", renderTransactionsTable);
  document.getElementById("tx-type-filter")?.addEventListener("change", renderTransactionsTable);
  document.getElementById("quick-type")?.addEventListener("change", (e) => {
    const isIncome = e.target.value === "income";
    document.getElementById("quick-category-wrap").hidden = isIncome;
  });
  document.getElementById("quick-form")?.addEventListener("submit", handleQuickAdd);
  document.getElementById("edit-form")?.addEventListener("submit", handleEditSubmit);
  document.getElementById("edit-type")?.addEventListener("change", (e) => populateEditCategories(e.target.value));
  document.getElementById("modal-close")?.addEventListener("click", closeEditModal);
  document.getElementById("edit-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "edit-modal") closeEditModal();
  });

  initSortHeaders();
  renderTransactionsTable();

  if (window.location.hash === "#add") {
    document.getElementById("add-section")?.scrollIntoView({ behavior: "smooth" });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "transactions") initTransactionsPage();
});
