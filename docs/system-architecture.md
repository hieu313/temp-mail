# System Architecture

## Overview

Temp Mail Browser runs as one Node.js process with two listeners:
- SMTP listener receives and parses mail.
- HTTP listener serves the static browser UI and JSON API.

SQLite stores runtime data in `emails.db`. The database is generated at runtime and uses WAL mode.

## Data Flow

```txt
SMTP client -> smtp-server -> mailparser -> sanitize body -> SQLite emails -> HTTP API -> Browser UI
Browser UI -> saved mailbox API -> SQLite saved_mailboxes
Browser UI -> email search API -> SQLite emails LIKE query -> filtered inbox
```

## Runtime Components

| File | Responsibility |
| --- | --- |
| `server.js` | HTTP server, SMTP server, SQLite setup, API routes, input validation, JSON error handling. |
| `public/index.html` | Browser page shell, saved mailbox sidebar, 2FA card, inbox table, dialogs. |
| `public/styles.css` | Framework-free responsive UI styles. |
| `public/app.js` | Client-side rendering, inbox loading/search, saved mailbox modal/sidebar behavior, TOTP UI state. |
| `public/two-factor-auth.js` | Browser/Node TOTP helper used by the UI and `/api/2fa/generate`. |

## SQLite Tables

### `emails`

Stores received email records:
- `id` primary key
- `from_address`
- `to_address`
- `subject`
- `body`
- `code`
- `created_at`

Deleting an email removes only its row from `emails`.

### `saved_mailboxes`

Stores saved mailbox shortcuts:
- `id` primary key
- `address` unique, required
- `reason` nullable
- `created_at`

Deleting a saved mailbox removes only the saved shortcut. It does not delete any rows from `emails`.

## HTTP API

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/api/emails` | List emails newest first. |
| `GET` | `/api/emails/search?q=...` | Search `from_address` and `to_address`; `%`, `_`, and `\` are escaped before the SQLite `LIKE` query. |
| `GET` | `/api/emails/:id` | Return full email detail including `body`. |
| `DELETE` | `/api/emails/:id` | Delete one email row. |
| `GET` | `/api/saved-mailboxes` | List saved mailboxes newest first. |
| `POST` | `/api/saved-mailboxes` | Create a saved mailbox with normalized lowercase `address` and nullable `reason`. |
| `DELETE` | `/api/saved-mailboxes/:id` | Delete one saved mailbox row only. |
| `POST` | `/api/2fa/generate` | Generate a TOTP code from a Base32 secret. |

## Error Handling

HTTP routes return JSON error payloads. The Express error handler logs server errors and returns `Internal server error` for 5xx responses.
