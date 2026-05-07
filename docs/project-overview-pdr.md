# Project Overview PDR

Temp Mail Browser is a small single-process Node app that receives email through SMTP, stores messages in SQLite, and displays them in a browser UI.

## Core Scope
- SMTP receiver for incoming messages.
- SQLite persistence in `emails.db`.
- Plain HTML/CSS/JS browser UI.
- Email table with sender, recipient, extracted 6-digit code, detail and delete actions.

## Out of Scope
- Authentication.
- Multi-user accounts.
- Email sending.
- Frontend framework/build pipeline.
