# Project Overview PDR

Temp Mail Browser is a small single-process Node app that receives email through SMTP, stores messages in SQLite, and displays them in a browser UI.

## Core Scope
- SMTP receiver for incoming messages.
- SQLite persistence in `emails.db`.
- Plain HTML/CSS/JS browser UI.
- Email table with sender, recipient, extracted 6-digit code, detail and delete actions.
- Search/filter by sender or recipient address.
- Saved mailbox shortcuts with optional reason text.
- TOTP code generation from a Base32 2FA secret.

## Requirements

| Area | Requirement |
| --- | --- |
| Email receive | Parse incoming SMTP messages and persist sanitized body content. |
| Inbox | Show newest emails first, allow detail view, delete individual emails, and auto-refresh. |
| Search | Filter emails by `fromAddress` or `toAddress`; treat user search text literally by escaping SQLite `LIKE` wildcards. |
| Saved mailboxes | Let users save unique mailbox addresses with nullable reasons, click a saved address to filter inbox search, and delete saved entries without deleting email rows. |
| Errors | Return JSON error responses from API routes. |

## Out of Scope
- Authentication.
- Multi-user accounts.
- Email sending.
- Frontend framework/build pipeline.
- Editing saved mailbox reasons after creation.
