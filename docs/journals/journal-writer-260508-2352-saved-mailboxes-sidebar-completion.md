# Saved Mailboxes Sidebar Completed Without Breaking the Inbox

**Date**: 2026-05-08 23:52
**Severity**: Medium
**Component**: Saved mailboxes sidebar / mailbox API
**Status**: Resolved

## What Happened

We finished the saved mailboxes sidebar implementation from `/home/hieunm/Workspace/projects/temp-mail/plans/260508-2259-saved-mailboxes-sidebar/plan.md` and got the plan to 100%. The backend now has a `saved_mailboxes` table and API in `server.js`; the frontend now has the sidebar, save modal, click-to-filter behavior, delete action, and responsive/accessibility polish across `public/index.html`, `public/app.js`, and `public/styles.css`.

## The Brutal Truth

This feature looks simple on the surface, but it touched the exact parts of the app that make temp-mail painful when they break: mailbox selection, search/filtering, and the main inbox flow. The relief is real because we did not ship a shiny sidebar that quietly wrecks email rendering or mobile layout. Still, the annoying truth is that sidebar state and mailbox state are now more coupled than before, and future changes can absolutely regress this if treated as “just UI.”

## Technical Details

Validation passed:

- `npm run check`
- `git diff --check`
- API smoke test
- Browser UI smoke test

Important implementation detail: search uses escaped `LIKE` input instead of trusting raw wildcard characters. The backend also gained a JSON error handler so API failures return predictable JSON instead of leaking inconsistent responses.

## What We Tried

We chose a direct sidebar implementation in the existing files instead of introducing a larger client-side state layer or new component system. That was the right call for YAGNI/KISS: the app is still small, and a framework-shaped abstraction here would have been ceremony pretending to be architecture.

Rejected alternatives:

- New frontend state manager: too much weight for saved mailbox CRUD.
- Separate saved mailbox page: worse UX; users need this next to the inbox.
- Raw `LIKE` search: faster to write, but sloppy and easy to abuse.

## Root Cause Analysis

The underlying gap was simple: mailbox reuse was not modeled as first-class data. Users had inboxes, but no persistent saved mailbox concept, so every UX improvement had to fake it through transient UI state. We fixed that by adding persistence and exposing explicit CRUD endpoints.

## Lessons Learned

Treat “small sidebar” work as data-model work when it changes user workflow. Also, escape search input immediately; do not wait for a bug report about wildcard behavior or weird query results.

## Next Steps

- Owner: main implementer; by next feature touching mailbox state, add regression coverage around save/filter/delete flows.
- Owner: tester; during next validation pass, repeat mobile smoke because sidebar layout is easy to break.
- Owner: docs-manager; keep changelog/roadmap aligned when saved mailbox behavior changes again.

Unresolved questions: none.
