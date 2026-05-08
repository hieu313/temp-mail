const emailRows = document.querySelector("#emailRows");
const searchInput = document.querySelector("#searchInput");
const refreshButton = document.querySelector("#refreshButton");
const twoFactorSecretInput = document.querySelector("#twoFactorSecretInput");
const twoFactorCodeButton = document.querySelector("#twoFactorCodeButton");
const emailModal = document.querySelector("#emailModal");
const closeModalButton = document.querySelector("#closeModalButton");
const savedMailboxList = document.querySelector("#savedMailboxList");
const openSavedMailboxModalButton = document.querySelector("#openSavedMailboxModalButton");
const savedMailboxModal = document.querySelector("#savedMailboxModal");
const closeSavedMailboxModalButton = document.querySelector("#closeSavedMailboxModalButton");
const savedMailboxForm = document.querySelector("#savedMailboxForm");
const savedMailboxAddressInput = document.querySelector("#savedMailboxAddressInput");
const savedMailboxReasonInput = document.querySelector("#savedMailboxReasonInput");
const savedMailboxSubmitButton = document.querySelector("#savedMailboxSubmitButton");

const detailFrom = document.querySelector("#detailFrom");
const detailTo = document.querySelector("#detailTo");
const detailSubject = document.querySelector("#detailSubject");
const detailBody = document.querySelector("#detailBody");

const TOTP_PERIOD_SECONDS = 30;
let twoFactorSecret = "";
let twoFactorRequestId = 0;
let emailRequestId = 0;
let savedMailboxRequestId = 0;
let twoFactorRefreshTimer;

function text(value) {
  return value || "—";
}

function truncate(value, maxLength = 48) {
  const normalized = text(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function renderStatus(message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.className = "empty";
  cell.colSpan = 5;
  cell.textContent = message;
  row.append(cell);
  emailRows.replaceChildren(row);
}

function createCell(value, options = {}) {
  const cell = document.createElement("td");
  if (options.className) cell.className = options.className;
  const content = options.truncate ? truncate(value, options.maxLength) : text(value);
  cell.textContent = content;
  if (content !== text(value)) cell.title = text(value);
  return cell;
}

function createAddressLine(label, value) {
  const line = document.createElement("div");
  const labelElement = document.createElement("span");
  const content = truncate(value);
  labelElement.textContent = label;
  line.append(labelElement, ` ${content}`);
  if (content !== text(value)) line.title = text(value);
  return line;
}

function createAddressCell(email) {
  const cell = document.createElement("td");
  cell.className = "address-cell";
  cell.append(
    createAddressLine("From", email.fromAddress),
    createAddressLine("To", email.toAddress),
  );
  return cell;
}

function createCodeCell(code) {
  const cell = document.createElement("td");
  cell.className = "code-cell";
  const button = document.createElement("button");
  button.className = "code-button";
  button.type = "button";
  button.dataset.code = code || "";
  button.textContent = text(code);
  button.title = code ? "Click để copy code" : "Không có code";
  button.disabled = !code;
  cell.append(button);
  return cell;
}

function createCreatedAtCell(createdAt) {
  const cell = document.createElement("td");
  cell.className = "created-at-column";
  const wrapper = document.createElement("div");
  const timeLine = document.createElement("div");
  const dateLine = document.createElement("div");
  const date = new Date(createdAt);

  wrapper.className = "created-at-cell";
  if (Number.isNaN(date.getTime())) {
    timeLine.textContent = "—";
    dateLine.textContent = "—";
  } else {
    timeLine.textContent = date.toLocaleTimeString("vi-VN", { hour12: false });
    dateLine.textContent = date.toLocaleDateString("vi-VN");
  }

  wrapper.append(timeLine, dateLine);
  cell.append(wrapper);
  return cell;
}

function createActionButton(label, className, id) {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.dataset.id = id;
  button.textContent = label;
  return button;
}

function renderSavedMailboxStatus(message) {
  const empty = document.createElement("p");
  empty.className = "empty";
  empty.setAttribute("role", "listitem");
  empty.textContent = message;
  savedMailboxList.replaceChildren(empty);
}

function createSavedMailboxItem(mailbox) {
  const item = document.createElement("div");
  const button = document.createElement("button");
  const address = document.createElement("strong");
  const deleteButton = document.createElement("button");

  item.className = "saved-mailbox-item";
  item.setAttribute("role", "listitem");
  button.className = "saved-mailbox-button";
  button.type = "button";
  button.dataset.address = mailbox.address;
  if (searchInput.value.trim() === mailbox.address) {
    button.classList.add("is-active");
    button.setAttribute("aria-current", "true");
  }
  address.textContent = mailbox.address;
  button.append(address);

  if (mailbox.reason) {
    const reason = document.createElement("span");
    reason.textContent = mailbox.reason;
    button.append(reason);
  }

  deleteButton.className = "delete-saved-mailbox-button";
  deleteButton.type = "button";
  deleteButton.dataset.id = mailbox.id;
  deleteButton.setAttribute("aria-label", `Xóa ${mailbox.address}`);
  deleteButton.textContent = "Xóa";
  item.append(button, deleteButton);
  return item;
}

function renderSavedMailboxes(mailboxes) {
  if (mailboxes.length === 0) {
    renderSavedMailboxStatus("Chưa lưu mail.");
    return;
  }

  savedMailboxList.replaceChildren(...mailboxes.map(createSavedMailboxItem));
}

function updateSavedMailboxActiveState() {
  const query = searchInput.value.trim();
  savedMailboxList.querySelectorAll(".saved-mailbox-button").forEach((button) => {
    const isActive = button.dataset.address === query;
    button.classList.toggle("is-active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

async function loadSavedMailboxes() {
  const requestId = ++savedMailboxRequestId;
  renderSavedMailboxStatus("Đang tải...");

  try {
    const response = await fetch("/api/saved-mailboxes");
    if (requestId !== savedMailboxRequestId) return;

    if (!response.ok) {
      renderSavedMailboxStatus("Không tải được saved mails.");
      return;
    }

    const mailboxes = await response.json();
    if (requestId !== savedMailboxRequestId) return;
    renderSavedMailboxes(mailboxes);
  } catch {
    if (requestId === savedMailboxRequestId) renderSavedMailboxStatus("Không tải được saved mails.");
  }
}

function renderEmails(emails) {
  if (emails.length === 0) {
    renderStatus("Chưa có email.");
    return;
  }

  emailRows.replaceChildren(...emails.map((email) => {
    const row = document.createElement("tr");
    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(
      createActionButton("Đọc", "view-button", email.id),
      createActionButton("Xóa", "delete-button", email.id),
    );
    actionsCell.append(actions);
    actionsCell.className = "actions-cell";
    row.append(
      createCell(email.subject, { className: "subject-cell", truncate: true, maxLength: 64 }),
      createAddressCell(email),
      createCodeCell(email.code),
      createCreatedAtCell(email.createdAt),
      actionsCell,
    );
    return row;
  }));
}

async function loadEmails() {
  const requestId = ++emailRequestId;
  renderStatus("Đang tải...");
  const query = searchInput.value.trim();
  const path = query ? `/api/emails/search?q=${encodeURIComponent(query)}` : "/api/emails";

  try {
    const response = await fetch(path);
    if (requestId !== emailRequestId) return;

    if (!response.ok) {
      renderStatus("Không tải được email.");
      return;
    }

    const emails = await response.json();
    if (requestId !== emailRequestId) return;
    renderEmails(emails);
  } catch {
    if (requestId === emailRequestId) renderStatus("Không tải được email.");
  }
}

async function showEmail(id) {
  const response = await fetch(`/api/emails/${id}`);

  if (!response.ok) {
    alert("Không tìm thấy email.");
    await loadEmails();
    return;
  }

  const email = await response.json();
  detailFrom.textContent = text(email.fromAddress);
  detailTo.textContent = text(email.toAddress);
  detailSubject.textContent = text(email.subject);
  detailBody.innerHTML = `<iframe srcdoc="${escapeHtml(email.body)}" sandbox="allow-same-origin"></iframe>`;
  emailModal.showModal();
}

async function deleteEmail(id) {
  if (!confirm("Xóa email này?")) return;

  const response = await fetch(`/api/emails/${id}`, { method: "DELETE" });

  if (!response.ok) {
    alert("Không xóa được email.");
    return;
  }

  await loadEmails();
}

function openSavedMailboxModal() {
  savedMailboxForm.reset();
  savedMailboxModal.showModal();
  savedMailboxAddressInput.focus();
}

async function createSavedMailbox(event) {
  event.preventDefault();
  savedMailboxSubmitButton.disabled = true;

  try {
    const response = await fetch("/api/saved-mailboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: savedMailboxAddressInput.value,
        reason: savedMailboxReasonInput.value,
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(result.error || "Không lưu được mail.");
      return;
    }

    savedMailboxModal.close();
    openSavedMailboxModalButton.focus();
    await loadSavedMailboxes();
  } catch {
    alert("Không lưu được mail.");
  } finally {
    savedMailboxSubmitButton.disabled = false;
  }
}

async function deleteSavedMailbox(id) {
  if (!confirm("Xóa mail đã lưu này?")) return;

  try {
    const response = await fetch(`/api/saved-mailboxes/${id}`, { method: "DELETE" });

    if (!response.ok) {
      alert("Không xóa được mail đã lưu.");
      return;
    }

    await loadSavedMailboxes();
  } catch {
    alert("Không xóa được mail đã lưu.");
  }
}

async function copyCode(button) {
  if (!button.dataset.code) return;

  await navigator.clipboard.writeText(button.dataset.code);
  button.textContent = "Copied";
  button.classList.add("copied");
  setTimeout(() => {
    if (button.textContent === "Copied") button.textContent = button.dataset.code || "—";
    button.classList.remove("copied");
  }, 900);
}

function resetTwoFactorCode() {
  twoFactorCodeButton.dataset.code = "";
  twoFactorCodeButton.textContent = "—";
  twoFactorCodeButton.disabled = true;
}

function scheduleTwoFactorRefresh() {
  clearTimeout(twoFactorRefreshTimer);
  if (!twoFactorSecret) return;

  const periodMs = TOTP_PERIOD_SECONDS * 1000;
  const delay = periodMs - (Date.now() % periodMs) + 100;
  twoFactorRefreshTimer = setTimeout(recomputeTwoFactorCode, delay);
}

function setTwoFactorSecret(secret) {
  const normalizedSecret = window.twoFactorAuth.normalizeSecret(secret);
  if (normalizedSecret === twoFactorSecret) return;

  twoFactorSecret = normalizedSecret;
  twoFactorRequestId += 1;
  clearTimeout(twoFactorRefreshTimer);
  resetTwoFactorCode();

  if (!twoFactorSecret) return;

  recomputeTwoFactorCode();
}

async function recomputeTwoFactorCode() {
  const requestId = ++twoFactorRequestId;
  const secret = twoFactorSecret;
  const periodMs = TOTP_PERIOD_SECONDS * 1000;
  const startedAt = Date.now();

  if (!secret) {
    resetTwoFactorCode();
    return;
  }

  try {
    const code = await window.twoFactorAuth.generateTotp(secret, { timestamp: startedAt });
    if (requestId !== twoFactorRequestId || secret !== twoFactorSecret) return;
    if (Math.floor(startedAt / periodMs) !== Math.floor(Date.now() / periodMs)) {
      recomputeTwoFactorCode();
      return;
    }

    twoFactorCodeButton.dataset.code = code;
    twoFactorCodeButton.textContent = code;
    twoFactorCodeButton.disabled = false;
    scheduleTwoFactorRefresh();
  } catch (error) {
    if (requestId !== twoFactorRequestId || secret !== twoFactorSecret) return;
    resetTwoFactorCode();
    alert(error.message);
  }
}

emailRows.addEventListener("click", (event) => {
  const codeButton = event.target.closest("button[data-code]");
  if (codeButton) {
    copyCode(codeButton);
    return;
  }

  const button = event.target.closest("button[data-id]");
  if (!button) return;

  if (button.classList.contains("view-button")) {
    showEmail(button.dataset.id);
    return;
  }

  if (button.classList.contains("delete-button")) {
    deleteEmail(button.dataset.id);
  }
});

savedMailboxList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-saved-mailbox-button");
  if (deleteButton) {
    deleteSavedMailbox(deleteButton.dataset.id);
    return;
  }

  const button = event.target.closest(".saved-mailbox-button");
  if (!button) return;

  searchInput.value = button.dataset.address;
  updateSavedMailboxActiveState();
  loadEmails();
});

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  updateSavedMailboxActiveState();
  searchTimer = setTimeout(loadEmails, 250);
});
refreshButton.addEventListener("click", () => {
  loadSavedMailboxes();
  loadEmails();
});
openSavedMailboxModalButton.addEventListener("click", openSavedMailboxModal);
savedMailboxForm.addEventListener("submit", createSavedMailbox);
closeSavedMailboxModalButton.addEventListener("click", () => {
  savedMailboxModal.close();
  openSavedMailboxModalButton.focus();
});
twoFactorSecretInput.addEventListener("input", () => setTwoFactorSecret(twoFactorSecretInput.value));
twoFactorCodeButton.addEventListener("click", () => copyCode(twoFactorCodeButton));
setInterval(loadEmails, 15000);
closeModalButton.addEventListener("click", () => emailModal.close());
savedMailboxModal.addEventListener("click", (event) => {
  if (event.target === savedMailboxModal) savedMailboxModal.close();
});
savedMailboxModal.addEventListener("close", () => openSavedMailboxModalButton.focus());
emailModal.addEventListener("click", (event) => {
  if (event.target === emailModal) emailModal.close();
});

setTwoFactorSecret(twoFactorSecretInput.value);
loadSavedMailboxes();
loadEmails();
