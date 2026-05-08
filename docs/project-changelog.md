# Project Changelog

## 2026-05-08
- Added saved mailbox persistence with `saved_mailboxes` SQLite table, nullable `reason`, and unique normalized `address`.
- Added `GET`, `POST`, and `DELETE` routes for `/api/saved-mailboxes` with JSON validation errors.
- Added saved mailbox sidebar and save modal; clicking a saved mailbox filters the inbox through the existing search flow.
- Kept saved mailbox deletion separate from email deletion; deleting a saved mailbox does not remove email records.
- Escaped SQLite `LIKE` wildcards for email address search.

## 2026-05-07
- Added initial Temp Mail Browser scope and architecture docs.
