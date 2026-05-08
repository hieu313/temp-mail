const express = require("express");
const createDOMPurify = require("dompurify");
const Database = require("better-sqlite3");
const { JSDOM } = require("jsdom");
const { simpleParser } = require("mailparser");
const path = require("path");
const { SMTPServer } = require("smtp-server");
const { generateTotp } = require("./public/two-factor-auth");

const HTTP_PORT = Number(process.env.HTTP_PORT || 3000);
const SMTP_PORT = Number(process.env.SMTP_PORT || 25);
const DB_PATH = path.join(__dirname, "emails.db");
const PUBLIC_DIR = path.join(__dirname, "public");
const DOMPurify = createDOMPurify(new JSDOM("").window);

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.prepare(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_address TEXT,
    to_address TEXT,
    subject TEXT,
    body TEXT,
    code TEXT,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS saved_mailboxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at TEXT NOT NULL
  )
`).run();

const insertEmail = db.prepare(`
  INSERT INTO emails (from_address, to_address, subject, body, code, created_at)
  VALUES (@fromAddress, @toAddress, @subject, @body, @code, @createdAt)
`);

const insertSavedMailbox = db.prepare(`
  INSERT INTO saved_mailboxes (address, reason, created_at)
  VALUES (@address, @reason, @createdAt)
`);

function seedWelcomeEmail() {
  const emailCount = db.prepare("SELECT COUNT(*) AS count FROM emails").get().count;
  if (emailCount > 0) return;

  const createdAt = new Date().toISOString();
  insertEmail.run({
    fromAddress: "welcome@temp-mail.local",
    toAddress: "inbox@hieunm3103.id.vn",
    subject: "Welcome to Temp Mail Browser",
    body: "Chào mừng bạn đến với Temp Mail Browser. Email mẫu này được tạo tự động để kiểm tra giao diện danh sách và modal chi tiết. Mã demo: 123456",
    code: "123456",
    createdAt,
  });
}

function extractCode(subject, body) {
  return subject?.match(/\b\d{6}\b/)?.[0] ?? body?.match(/>\s*(\d{6})\s*<\//)?.[1] ?? null;
}

function sanitizeBody(parsed) {
  if (parsed.html) return DOMPurify.sanitize(parsed.html);
  return parsed.text || "";
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function logEmail(email) {
  console.log([
    "=".repeat(72),
    `[${email.createdAt}] NEW EMAIL`,
    JSON.stringify(email, null, 2),
    "=".repeat(72),
  ].join("\n"));
}

seedWelcomeEmail();

function mapEmail(row) {
  return {
    id: row.id,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    subject: row.subject,
    body: row.body,
    code: row.code,
    createdAt: row.created_at,
  };
}

function mapSavedMailbox(row) {
  return {
    id: row.id,
    address: row.address,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function normalizeSavedMailboxReason(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be an object." };
  }

  if (body.reason != null && typeof body.reason !== "string") {
    return { error: "Reason must be a string." };
  }

  const reason = body.reason?.trim() || null;

  if (reason && reason.length > 500) {
    return { error: "Reason must be 500 characters or less." };
  }

  return { reason };
}

function normalizeSavedMailboxInput(body) {
  const savedMailboxReason = normalizeSavedMailboxReason(body);

  if (savedMailboxReason.error) {
    return savedMailboxReason;
  }

  if (typeof body.address !== "string") {
    return { error: "Valid email address is required." };
  }

  const address = body.address.trim().toLowerCase();

  if (!address || address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { error: "Valid email address is required." };
  }

  return { address, reason: savedMailboxReason.reason };
}

function normalizeSavedMailboxId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

const app = express();
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.post("/api/2fa/generate", (req, res) => {
  try {
    const code = generateTotp(req.body.secret);
    res.json({ code });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/saved-mailboxes", (req, res) => {
  const rows = db.prepare(`
    SELECT id, address, reason, created_at
    FROM saved_mailboxes
    ORDER BY id DESC
  `).all();

  res.json(rows.map(mapSavedMailbox));
});

app.post("/api/saved-mailboxes", (req, res) => {
  const savedMailbox = normalizeSavedMailboxInput(req.body);

  if (savedMailbox.error) {
    res.status(400).json({ error: savedMailbox.error });
    return;
  }

  try {
    const createdAt = new Date().toISOString();
    const result = insertSavedMailbox.run({ ...savedMailbox, createdAt });
    const row = db.prepare("SELECT * FROM saved_mailboxes WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(mapSavedMailbox(row));
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ error: "Saved mailbox already exists." });
      return;
    }

    throw error;
  }
});

app.patch("/api/saved-mailboxes/:id", (req, res) => {
  const id = normalizeSavedMailboxId(req.params.id);

  if (!id) {
    res.status(400).json({ error: "Valid saved mailbox id is required." });
    return;
  }

  const savedMailboxReason = normalizeSavedMailboxReason(req.body);

  if (savedMailboxReason.error) {
    res.status(400).json({ error: savedMailboxReason.error });
    return;
  }

  const result = db.prepare("UPDATE saved_mailboxes SET reason = ? WHERE id = ?").run(savedMailboxReason.reason, id);

  if (result.changes === 0) {
    res.status(404).json({ error: "Saved mailbox not found" });
    return;
  }

  const row = db.prepare("SELECT * FROM saved_mailboxes WHERE id = ?").get(id);
  res.json(mapSavedMailbox(row));
});

app.delete("/api/saved-mailboxes/:id", (req, res) => {
  const id = normalizeSavedMailboxId(req.params.id);

  if (!id) {
    res.status(400).json({ error: "Valid saved mailbox id is required." });
    return;
  }

  const result = db.prepare("DELETE FROM saved_mailboxes WHERE id = ?").run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: "Saved mailbox not found" });
    return;
  }

  res.status(204).end();
});

app.get("/api/emails", (req, res) => {
  const rows = db.prepare(`
    SELECT id, from_address, to_address, subject, code, created_at
    FROM emails
    ORDER BY id DESC
  `).all();

  res.json(rows.map(mapEmail));
});

app.get("/api/emails/search", (req, res) => {
  const query = String(req.query.q || "").trim();

  if (!query) {
    res.json([]);
    return;
  }

  const rows = db.prepare(`
    SELECT id, from_address, to_address, subject, code, created_at
    FROM emails
    WHERE from_address LIKE @query ESCAPE '\\' OR to_address LIKE @query ESCAPE '\\'
    ORDER BY id DESC
  `).all({ query: `%${escapeLike(query)}%` });

  res.json(rows.map(mapEmail));
});

app.get("/api/emails/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM emails WHERE id = ?").get(req.params.id);

  if (!row) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  res.json(mapEmail(row));
});

app.delete("/api/emails/:id", (req, res) => {
  const result = db.prepare("DELETE FROM emails WHERE id = ?").run(req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  res.status(204).end();
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 500;
  if (status >= 500) console.error(error);

  res.status(status).json({ error: status >= 500 ? "Internal server error" : "Invalid request." });
});

const smtpServer = new SMTPServer({
  authOptional: true,
  disabledCommands: ["AUTH", "STARTTLS"],
  onData(stream, session, callback) {
    simpleParser(stream, (err, parsed) => {
      if (err) {
        callback(err);
        return;
      }

      const body = sanitizeBody(parsed);
      const email = {
        fromAddress: parsed.from?.value?.[0]?.address ?? parsed.from?.text ?? null,
        toAddress: parsed.to?.value?.[0]?.address ?? null,
        subject: parsed.subject ?? null,
        body,
        code: extractCode(parsed.subject, body),
        createdAt: new Date().toISOString(),
      };

      insertEmail.run(email);
      logEmail(email);
      callback();
    });
  },
});

app.listen(HTTP_PORT, () => {
  console.log(`Temp mail browser: http://localhost:${HTTP_PORT}`);
});

smtpServer.listen(SMTP_PORT, () => {
  console.log(`SMTP server listening on port ${SMTP_PORT}`);
});
