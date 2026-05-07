# Temp Mail Browser

A tiny temp mail receiver with one Node.js process:

- Receives email through SMTP.
- Parses email with `mailparser`.
- Stores messages in SQLite (`emails.db`).
- Shows a browser table with sender, recipient, extracted 6-digit code, detail modal, and delete action.

## Project Structure

```txt
temp-mail/
├── server.js
├── package.json
├── emails.db
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

`emails.db` is generated at runtime and is ignored by git.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Defaults:

- Browser UI: `http://localhost:3000`
- SMTP server: port `25`

Port `25` may require root permission or may already be used by another mail service. For local testing, use a non-privileged SMTP port:

```bash
SMTP_PORT=2525 npm start
```

You can also change the HTTP port:

```bash
HTTP_PORT=8080 SMTP_PORT=2525 npm start
```

## Validate

```bash
npm run check
```

## API

### List emails

```http
GET /api/emails
```

Returns rows with:

- `id`
- `fromAddress`
- `toAddress`
- `subject`
- `date`
- `code`
- `createdAt`

### Get email detail

```http
GET /api/emails/:id
```

Returns full email detail, including `body`.

### Delete email

```http
DELETE /api/emails/:id
```

Deletes an email by id.

## Code Extraction

The app extracts the first 6-digit code from the email body with:

```js
/\b\d{6}\b/
```

If no code exists, `code` is `null`.
