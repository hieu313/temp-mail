const emailRows = document.querySelector("#emailRows");
const refreshButton = document.querySelector("#refreshButton");
const emailModal = document.querySelector("#emailModal");
const closeModalButton = document.querySelector("#closeModalButton");

const detailFrom = document.querySelector("#detailFrom");
const detailTo = document.querySelector("#detailTo");
const detailSubject = document.querySelector("#detailSubject");
const detailCreatedAt = document.querySelector("#detailCreatedAt");
const detailCode = document.querySelector("#detailCode");
const detailBody = document.querySelector("#detailBody");

function text(value) {
  return value || "—";
}

function renderStatus(message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.className = "empty";
  cell.colSpan = 4;
  cell.textContent = message;
  row.append(cell);
  emailRows.replaceChildren(row);
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = text(value);
  return cell;
}

function createAddressLine(label, value) {
  const line = document.createElement("div");
  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  line.append(labelElement, ` ${text(value)}`);
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
      createActionButton("Xem chi tiết", "view-button", email.id),
      createActionButton("Xóa", "delete-button", email.id),
    );
    actionsCell.append(actions);
    row.append(
      createCell(email.subject),
      createAddressCell(email),
      createCell(email.code),
      actionsCell,
    );
    return row;
  }));
}

async function loadEmails() {
  renderStatus("Đang tải...");
  const response = await fetch("/api/emails");

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
  detailCreatedAt.textContent = text(email.createdAt);
  detailCode.textContent = text(email.code);
  detailBody.textContent = text(email.body);
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

emailRows.addEventListener("click", (event) => {
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

refreshButton.addEventListener("click", loadEmails);
closeModalButton.addEventListener("click", () => emailModal.close());
emailModal.addEventListener("click", (event) => {
  if (event.target === emailModal) emailModal.close();
});

loadEmails();
