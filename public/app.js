const emailRows = document.querySelector("#emailRows");
const searchInput = document.querySelector("#searchInput");
const refreshButton = document.querySelector("#refreshButton");
const twoFactorSecretInput = document.querySelector("#twoFactorSecretInput");
const twoFactorCodeButton = document.querySelector("#twoFactorCodeButton");
const emailModal = document.querySelector("#emailModal");
const closeModalButton = document.querySelector("#closeModalButton");

const detailFrom = document.querySelector("#detailFrom");
const detailTo = document.querySelector("#detailTo");
const detailSubject = document.querySelector("#detailSubject");
const detailBody = document.querySelector("#detailBody");

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
  renderStatus("Đang tải...");
  const query = searchInput.value.trim();
  const path = query ? `/api/emails/search?q=${encodeURIComponent(query)}` : "/api/emails";
  const response = await fetch(path);

  if (!response.ok) {
    renderStatus("Không tải được email.");
    return;
  }

  renderEmails(await response.json());
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

async function copyCode(button) {
  if (!button.dataset.code) return;

  await navigator.clipboard.writeText(button.dataset.code);
  const originalText = button.textContent;
  button.textContent = "Copied";
  button.classList.add("copied");
  setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("copied");
  }, 900);
}

async function generateTwoFactorCode() {
  const secret = twoFactorSecretInput.value.trim();
  if (!secret) return;

  try {
    const code = await window.twoFactorAuth.generateTotp(secret);
    twoFactorCodeButton.dataset.code = code;
    twoFactorCodeButton.textContent = code;
    twoFactorCodeButton.disabled = false;
  } catch (error) {
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

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadEmails, 250);
});
refreshButton.addEventListener("click", loadEmails);
twoFactorSecretInput.addEventListener("input", generateTwoFactorCode);
twoFactorCodeButton.addEventListener("click", () => copyCode(twoFactorCodeButton));
setInterval(loadEmails, 15000);
closeModalButton.addEventListener("click", () => emailModal.close());
emailModal.addEventListener("click", (event) => {
  if (event.target === emailModal) emailModal.close();
});

loadEmails();
