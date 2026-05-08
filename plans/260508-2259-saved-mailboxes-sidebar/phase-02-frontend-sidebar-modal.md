# Phase 02: Frontend Sidebar + Modal

## Context Links
- Plan: `/home/hieunm/Workspace/projects/temp-mail/plans/260508-2259-saved-mailboxes-sidebar/plan.md`
- Code: `/home/hieunm/Workspace/projects/temp-mail/public/index.html`, `/home/hieunm/Workspace/projects/temp-mail/public/app.js`

## Overview
- Priority: P2
- Status: completed
- Adds saved mailbox sidebar, add button, modal form, list/delete/click-to-filter behavior.

## Requirements
- Plain HTML + vanilla JS only.
- Sidebar lists saved mailboxes with address and optional reason.
- Button opens modal with address + nullable reason.
- Save creates saved mailbox via API.
- Clicking saved mailbox filters inbox by address using existing search flow.
- Delete saved mailbox only removes saved row.

## Architecture + Data Flow
1. Page load calls existing `loadEmails()` plus new `loadSavedMailboxes()`.
2. Add modal form submits to `POST /api/saved-mailboxes`.
3. Successful save closes modal, resets form, reloads saved list.
4. Saved mailbox click sets `searchInput.value` to address and calls `loadEmails()`; no new email filtering logic.
5. Saved mailbox delete calls `DELETE /api/saved-mailboxes/:id`, then reloads saved list. Stop event propagation so delete does not filter.

## Related Code Files
- Modify: `/home/hieunm/Workspace/projects/temp-mail/public/index.html`
- Modify: `/home/hieunm/Workspace/projects/temp-mail/public/app.js`
- Create/delete: none

## DOM Additions
- Layout wrapper around sidebar + main inbox content.
- Sidebar section:
  - `#savedMailboxList`
  - `#openSavedMailboxModalButton`
- Dialog:
  - `#savedMailboxModal`
  - `#savedMailboxForm`
  - `#savedMailboxAddressInput`
  - `#savedMailboxReasonInput`
  - close/cancel button

## Implementation Steps
1. In `index.html`, wrap existing cards/table content in layout allowing sidebar.
2. Add saved mailbox sidebar markup before inbox content.
3. Add saved mailbox dialog form near existing email detail dialog.
4. In `app.js`, query new DOM elements.
5. Add `renderSavedMailboxes(mailboxes)` with empty state.
6. Add `loadSavedMailboxes()` fetching `GET /api/saved-mailboxes`.
7. Add submit handler for create.
8. Add sidebar click delegation:
   - `.saved-mailbox-button` -> set search value + `loadEmails()`.
   - `.delete-saved-mailbox-button` -> confirm + delete + reload list.
9. Keep existing search debounce/refresh behavior intact.

## Todo List
- [x] Add sidebar markup.
- [x] Add create dialog markup.
- [x] Add saved mailbox fetch/render functions.
- [x] Add create submit handler.
- [x] Add click-to-filter handler using `searchInput` + `loadEmails`.
- [x] Add delete handler with propagation guard.

## Success Criteria
- Modal create works with address only.
- Optional reason displays if present; absent reason does not show `undefined`.
- Clicking address uses existing `/api/emails/search` through `loadEmails()`.
- Existing email detail/delete/code copy still work.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Event delegation conflict with email table buttons | Low | Medium | Sidebar has own listener; do not reuse table listener. |
| Auto-refresh clears user selected filter | Low | Medium | Existing `loadEmails()` reads `searchInput`; selected filter persists in input. |
| Modal submit double-click creates duplicate | Medium | Low | Disable submit while request pending or rely on 409 + alert. KISS: disable if simple. |
| App.js file growth past 200 lines already exists | High | Low | Do not modularize in this feature unless required; note future refactor separately. |

## Security Considerations
- Use `textContent`, not `innerHTML`, for saved address/reason rendering.
- Do not trust backend errors for HTML injection; alert plain text only.

## Rollback
- Revert `public/index.html` and `public/app.js` changes; backend API can remain unused.

## Next Steps
- P3 styles and validation after DOM/behavior works.
