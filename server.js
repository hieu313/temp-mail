const express = require("express");
const Database = require("better-sqlite3");
const { simpleParser } = require("mailparser");
const path = require("path");
const { SMTPServer } = require("smtp-server");

const HTTP_PORT = Number(process.env.HTTP_PORT || 3000);
const SMTP_PORT = Number(process.env.SMTP_PORT || 25);
const DB_PATH = path.join(__dirname, "emails.db");
const PUBLIC_DIR = path.join(__dirname, "public");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.prepare(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_address TEXT,
    to_address TEXT,
    subject TEXT,
    date TEXT,
    body TEXT,
    code TEXT,
    created_at TEXT NOT NULL
  )
`).run();

const insertEmail = db.prepare(`
  INSERT INTO emails (from_address, to_address, subject, date, body, code, created_at)
  VALUES (@fromAddress, @toAddress, @subject, @date, @body, @code, @createdAt)
`);

function extractCode(body) {
  return body?.match(/\b\d{6}\b/)?.[0] ?? null;
}

function mapEmail(row) {
  return {
    id: row.id,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    subject: row.subject,
    date: row.date,
    body: row.body,
    code: row.code,
    createdAt: row.created_at,
  };
}

const app = express();
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get("/api/emails", (req, res) => {
  const rows = db.prepare(`
    SELECT id, from_address, to_address, subject, date, code, created_at
    FROM emails
    ORDER BY id DESC
  `).all();

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

const smtpServer = new SMTPServer({
  authOptional: true,
  disabledCommands: ["AUTH"],
  onData(stream, session, callback) {
    simpleParser(stream, (err, parsed) => {
      if (err) {
        callback(err);
        return;
      }

      const body = parsed.text || parsed.html || "";
      const email = {
        fromAddress: parsed.from?.value?.[0]?.address ?? parsed.from?.text ?? null,
        toAddress: parsed.to?.value?.[0]?.address ?? null,
        subject: parsed.subject ?? null,
        date: parsed.date?.toISOString?.() ?? parsed.date?.toString?.() ?? null,
        body,
        code: extractCode(body),
        createdAt: new Date().toISOString(),
      };

      insertEmail.run(email);
      console.log(`[${email.createdAt}] mail ${email.fromAddress ?? "unknown"} -> ${email.toAddress ?? "unknown"}`);
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
