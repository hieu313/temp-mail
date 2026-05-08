---
title: "Saved temp mailboxes sidebar"
description: "Add persistent saved mailbox addresses and a sidebar-driven inbox filter."
status: completed
progress: 100%
priority: P2
effort: 4h
branch: main
completed: 2026-05-08
tags: [sqlite, express, vanilla-js, ui]
created: 2026-05-08
blockedBy: []
blocks: []
---

# Saved Temp Mailboxes Sidebar Plan

## Scope
Add a small saved mailbox feature: SQLite table, list/create/delete API, sidebar UI, modal create form, click-to-filter via existing search flow. No framework, no email deletion coupling.

## Phases
| ID | Phase | Status | Effort | Depends on | File ownership |
|---|---|---|---:|---|---|
| P1 | [Backend data + API](phase-01-backend-data-api.md) | completed | 1.5h | none | `server.js` |
| P2 | [Frontend sidebar + modal](phase-02-frontend-sidebar-modal.md) | completed | 1.5h | P1 | `public/index.html`, `public/app.js` |
| P3 | [Styles + validation](phase-03-styles-validation.md) | completed | 1h | P2 | `public/styles.css`, validation only |

## API Design
- `GET /api/saved-mailboxes` -> `[{ id, address, reason, createdAt }]`, newest first or address asc; pick one and keep stable.
- `POST /api/saved-mailboxes` body `{ address, reason? }` -> `201` saved row.
- `DELETE /api/saved-mailboxes/:id` -> `204`; only deletes from `saved_mailboxes`.
- Optional only if trivial: `PATCH /api/saved-mailboxes/:id` for reason. Do not include unless implementation stays small.

## Data Model
`CREATE TABLE IF NOT EXISTS saved_mailboxes (`
- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `address TEXT NOT NULL UNIQUE`
- `reason TEXT NULL`
- `created_at TEXT NOT NULL`
`)`

## Data Flows
- Create: modal inputs -> frontend trim/normalize -> `POST /api/saved-mailboxes` -> validate -> SQLite insert -> response -> sidebar reload.
- List: page load/refresh sidebar -> `GET /api/saved-mailboxes` -> map snake_case to camelCase -> render buttons.
- Filter: saved mailbox click -> set `searchInput.value = address` -> call existing `loadEmails()` -> `/api/emails/search?q=address` -> table render.
- Delete saved: sidebar delete click -> `DELETE /api/saved-mailboxes/:id` -> remove saved row only -> sidebar reload; `emails` untouched.

## Backward Compatibility
- `CREATE TABLE IF NOT EXISTS` is additive; existing `emails` rows and APIs unaffected.
- Existing search, delete email, SMTP receive paths unchanged.
- If table creation fails, app startup fails fast like existing SQLite setup; no partial migration state expected.

## Test Matrix
- Unit/syntax: `npm run check`.
- API smoke: list empty/non-empty, create valid, create duplicate, delete existing/missing.
- Integration: create saved mailbox, click it, existing email search results filter by `to_address/from_address`.
- Regression: delete saved mailbox then verify matching emails still in `/api/emails/search` or `/api/emails`.
- UI: modal open/close/save, reason nullable, responsive sidebar usable on mobile.

## Rollback
- Revert `server.js`, `public/index.html`, `public/app.js`, `public/styles.css` changes.
- Leave `saved_mailboxes` table in SQLite; harmless orphan table. If required: manual `DROP TABLE saved_mailboxes` after backup.

## Success Criteria
- Saved mailbox persists across server restart.
- Sidebar lists saved addresses with optional reason.
- Save modal creates row; duplicate address returns clear 409/400 and UI shows alert.
- Clicking saved address filters inbox through existing search field/flow.
- Deleting saved address never removes rows from `emails`.
- `npm run check` passes.

## Completion Status
- Progress: 100%; P1/P2/P3 completed; phase todo lists checked.
- Validation required by plan: `npm run check` and API/UI smoke checks completed per P3 checklist.

## Unresolved Questions
- None. Sort policy resolved by default plan: newest first for simple UX.
