# Phase 03: Styles + Validation

## Context Links
- Plan: `/home/hieunm/Workspace/projects/temp-mail/plans/260508-2259-saved-mailboxes-sidebar/plan.md`
- Code: `/home/hieunm/Workspace/projects/temp-mail/public/styles.css`, `/home/hieunm/Workspace/projects/temp-mail/package.json`

## Overview
- Priority: P2
- Status: completed
- Adds responsive sidebar/modal styling and validates backend/frontend syntax + smoke paths.

## Requirements
- Keep current visual language: cards, rounded buttons, compact table.
- Sidebar usable desktop and mobile.
- No new dependencies/build tools.
- Run `npm run check`.

## Architecture + Data Flow
- CSS only changes layout/presentation.
- Validation confirms JS parses and feature flows match API/data model.
- No data transform in this phase except manual/API smoke verification.

## Related Code Files
- Modify: `/home/hieunm/Workspace/projects/temp-mail/public/styles.css`
- Read/validate: `/home/hieunm/Workspace/projects/temp-mail/package.json`
- Create/delete: none

## Styling Plan
- Add `.content-layout` grid: sidebar fixed-ish width + main content flexible.
- Add `.saved-mailboxes-card`, list, row button, delete button styles.
- Reuse existing `.card`, `.modal-card`, `.modal-header` where possible.
- Extend input selectors to include saved mailbox modal inputs.
- Mobile: stack sidebar above inbox under `@media (max-width: 720px)`.

## Validation Steps
1. Run `npm run check`.
2. Start app if appropriate: `SMTP_PORT=2525 npm start`.
3. API smoke:
   - `GET /api/saved-mailboxes` returns JSON.
   - `POST /api/saved-mailboxes` with address only returns row with `reason: null`.
   - Duplicate `POST` returns 409.
   - `DELETE /api/saved-mailboxes/:id` returns 204.
4. Regression smoke:
   - `GET /api/emails` still returns existing email list.
   - `GET /api/emails/search?q=<saved-address>` still filters emails.
   - Delete saved mailbox and confirm email rows remain.
5. Browser smoke:
   - Sidebar renders saved mailbox.
   - Add modal opens/closes/submits.
   - Saved mailbox click populates search input and filters table.
   - Existing email modal/delete/code copy still work.

## Todo List
- [x] Add desktop sidebar layout styles.
- [x] Add saved list/button/delete styles.
- [x] Add modal form/input styles.
- [x] Add responsive stacking.
- [x] Run `npm run check`.
- [x] Run API/UI smoke checks.

## Success Criteria
- Sidebar does not break current table layout on desktop.
- Mobile layout remains usable without horizontal page overflow beyond existing table constraints.
- All validation steps pass.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sidebar compresses email table too much | Medium | Medium | Use grid with minmax and stack at 720px. |
| CSS selector unintentionally changes 2FA input | Medium | Low | Reuse shared input styles intentionally; verify 2FA card. |
| Manual smoke misses DB side effect | Low | High | Explicitly compare email search/list after saved delete. |

## Security Considerations
- No sensitive data in logs beyond existing temp mail behavior.
- Validate no saved reason rendered via `innerHTML` from P2.

## Rollback
- Revert `public/styles.css`; feature still functional but less polished.
- If validation reveals backend/frontend issue, revert the specific phase file changes in reverse order P3 -> P2 -> P1.

## Next Steps
- If docs impact deemed necessary after implementation, update `/home/hieunm/Workspace/projects/temp-mail/docs/system-architecture.md` with saved mailbox table/API note.
