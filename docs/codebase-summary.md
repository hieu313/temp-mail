# Codebase Summary

Generated from `/home/hieunm/Workspace/projects/temp-mail/repomix-output.xml` on 2026-05-08.

## Purpose

Temp Mail Browser is a dependency-light Node.js app for receiving SMTP email, storing messages in SQLite, and browsing them through a static web UI.

## Runtime Shape

| Area | Files | Notes |
| --- | --- | --- |
| Server | `server.js` | Express 5 HTTP API/static server, `smtp-server` listener, SQLite schema, input validation, JSON error handler. |
| UI shell | `public/index.html` | Header search, saved mailbox sidebar/modal, 2FA card, inbox table, email detail dialog. |
| UI logic | `public/app.js` | Loads/searches emails, creates/deletes saved mailboxes, renders sidebar/table, manages dialogs, copies codes, refreshes TOTP. |
| TOTP | `public/two-factor-auth.js` | Shared browser/Node Base32 TOTP generator. |
| Styling | `public/styles.css` | Framework-free layout and component styles. |
| Docs | `docs/*.md` | Architecture, PDR, roadmap, deployment, design, changelog, standards. |

## Data Model

- `emails`: received messages with sender, recipient, subject, sanitized body, extracted code, and creation timestamp.
- `saved_mailboxes`: saved address shortcuts with unique normalized address, nullable reason, and creation timestamp.

## API Surface

- `/api/emails`: list inbox messages.
- `/api/emails/search`: search sender/recipient address fields with escaped SQLite `LIKE` wildcards.
- `/api/emails/:id`: read or delete a single email.
- `/api/saved-mailboxes`: list or create saved mailbox shortcuts.
- `/api/saved-mailboxes/:id`: delete a saved mailbox shortcut only.
- `/api/2fa/generate`: generate a TOTP code.

## Validation

`npm run check` runs Node syntax checks for `server.js` and `public/app.js`.
