# Phase 01: Backend Data + API

## Context Links
- Plan: `/home/hieunm/Workspace/projects/temp-mail/plans/260508-2259-saved-mailboxes-sidebar/plan.md`
- Code: `/home/hieunm/Workspace/projects/temp-mail/server.js`
- Docs: `/home/hieunm/Workspace/projects/temp-mail/docs/system-architecture.md`, `/home/hieunm/Workspace/projects/temp-mail/docs/code-standards.md`

## Overview
- Priority: P2
- Status: completed
- Adds persistent `saved_mailboxes` table and minimal CRUD API: list/create/delete.

## Requirements
- Add separate SQLite table; no relationship/cascade with `emails`.
- `reason` nullable.
- Validate HTTP input at boundary.
- Keep plain Express + better-sqlite3 sync style.

## Architecture + Data Flow
1. Server startup runs `CREATE TABLE IF NOT EXISTS saved_mailboxes` after `emails` table setup.
2. `POST /api/saved-mailboxes` accepts JSON body, trims address/reason, converts blank reason to `null`, inserts row.
3. `GET /api/saved-mailboxes` reads rows, maps DB columns to camelCase JSON.
4. `DELETE /api/saved-mailboxes/:id` deletes only `saved_mailboxes` by id; no SQL touching `emails`.

## Data Model
```sql
CREATE TABLE IF NOT EXISTS saved_mailboxes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TEXT NOT NULL
);
```

## API Contract
- `GET /api/saved-mailboxes`
  - 200: `[{ id, address, reason, createdAt }]`
- `POST /api/saved-mailboxes`
  - Body: `{ "address": "name@example.com", "reason": "optional" }`
  - 201: created row
  - 400: missing/invalid address
  - 409: duplicate address
- `DELETE /api/saved-mailboxes/:id`
  - 204: deleted
  - 404: not found

## Related Code Files
- Modify: `/home/hieunm/Workspace/projects/temp-mail/server.js`
- Create/delete: none

## Implementation Steps
1. Add table creation near existing `emails` table setup.
2. Add prepared statements or inline statements for list/create/delete.
3. Add `mapSavedMailbox(row)` helper.
4. Add `normalizeSavedMailboxInput(body)` or small inline validation.
5. Add routes before `/api/emails/:id` to avoid route ambiguity best practice.
6. Handle SQLite unique constraint and return 409.

## Todo List
- [x] Create `saved_mailboxes` table.
- [x] Add mapper and validation.
- [x] Add list route.
- [x] Add create route.
- [x] Add delete route.
- [x] Confirm delete route only targets `saved_mailboxes`.

## Success Criteria
- Existing email APIs unchanged.
- Duplicate saved address rejected deterministically.
- Blank reason stored/returned as `null`.
- Deleting saved mailbox does not change `emails` count.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Route collision with `/api/emails/:id` | Low | Medium | Use distinct `/api/saved-mailboxes` prefix. |
| Duplicate creates crash API | Medium | Medium | Catch SQLite unique error and return 409. |
| Over-validating email aliases | Medium | Low | KISS: require non-empty string containing `@`, max length; do not complex RFC parse. |

## Security Considerations
- Cap address/reason lengths to avoid oversized payloads.
- Return generic validation errors; do not expose SQL internals.

## Rollback
- Revert `server.js` changes. Table may remain unused; no app impact.

## Next Steps
- P2 can start after API routes exist.
