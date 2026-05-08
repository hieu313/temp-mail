# Saved Mailboxes Sidebar Planning Completed

**Date**: 2026-05-08 23:05
**Severity**: Low
**Component**: Saved mailboxes sidebar / SQLite / API / inbox filter
**Status**: Resolved

## What Happened

Planning is complete for the saved mailboxes sidebar feature. The plan lives at `/home/hieunm/Workspace/projects/temp-mail/plans/260508-2259-saved-mailboxes-sidebar/plan.md` and breaks work into backend data/API, frontend sidebar/modal, then styles/validation. No code has been implemented yet, which is good: the scope is still cheap to correct.

## The Brutal Truth

The uncomfortable part is how easy this feature could turn into accidental email deletion or a half-baked second inbox model. We had to explicitly say that deleting a saved mailbox only deletes from `saved_mailboxes`, not `emails`, because otherwise someone tired at 2am could wire the delete button to the wrong mental model and destroy user-visible mail history. That would be a stupid, avoidable self-inflicted wound.

## Technical Details

Planned table:

```sql
CREATE TABLE IF NOT EXISTS saved_mailboxes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  reason TEXT NULL,
  created_at TEXT NOT NULL
)
```

Planned API surface is deliberately small: `GET /api/saved-mailboxes`, `POST /api/saved-mailboxes`, and `DELETE /api/saved-mailboxes/:id`. Clicking a saved address must reuse the existing search flow by setting the search input and calling `loadEmails()`, not inventing a parallel filter system. Validation target remains `npm run check` plus smoke tests for duplicates and delete safety.

## What We Tried

We considered adding `PATCH /api/saved-mailboxes/:id` for editing reasons, but rejected it unless it stays trivial. That is the right call. Reason editing is nice-to-have; persistence, filtering, and safe deletion are the actual feature.

## Root Cause Analysis

The planning risk came from feature ambiguity: “saved mailbox” sounds close enough to “email mailbox” that CRUD boundaries could blur. The root mistake to avoid is coupling saved-address metadata to stored email rows.

## Lessons Learned

Keep the saved mailbox model boring and separate. Reuse existing inbox search instead of creating a new state path. Add regression coverage proving saved-entry deletion does not remove email records.

## Next Steps

Backend owner implements `server.js` table and CRUD API first. Frontend owner adds sidebar/modal after API lands. Tester runs `npm run check` and verifies create, duplicate, filter, and delete-does-not-delete-emails before merge.
