# TOTP Setter and Recompute Race Fix

**Date**: 2026-05-08 19:27
**Severity**: Medium
**Component**: 2FA/TOTP UI (`public/app.js`)
**Status**: Resolved

## What Happened

We finished the vanilla JS TOTP setter+recompute path in `public/app.js`. The UI now keeps one canonical normalized secret, clears the displayed code when the secret is empty or changed, refreshes on the 30s TOTP boundary, and protects async `generateTotp` results with request id + secret checks. If generation crosses a period boundary, stale output is discarded and recomputed instead of shown.

## The Brutal Truth

This was exactly the kind of front-end time bug that quietly makes 2FA feel broken. The painful part: a code can be mathematically valid for the wrong 30-second window and still look fine in the UI. That is worse than an obvious crash because users blame themselves first. Copy feedback restoring an old code was the real kick in the teeth: the UI could lie after we already computed the right thing.

## Technical Details

Changed only `/home/hieunm/Workspace/projects/temp-mail/public/app.js`.

Key behaviors now covered:
- normalized secret is canonical state
- empty or changed secret clears current TOTP code
- refresh aligns with 30s TOTP boundary
- async `generateTotp` guarded by request id and secret
- generation crossing period boundary triggers discard/recompute
- copy feedback does not restore stale code

Validation passed:
- `npm run check` passed
- tester custom jsdom/browser validation passed
- code reviewer found no blockers

## What We Tried

We chose setter+recompute in plain JS, inside existing `public/app.js`. Rejected framework/state-manager work because it would be fake architecture for one small UI state problem. Rejected trusting async completion order because that is how stale codes leak. Rejected copy feedback restoring prior text because prior text may already be invalid.

## Root Cause Analysis

The root issue was not TOTP math. It was UI state ownership and async timing. We had no strict rule saying which secret/code pair was current, and no guard that async results still matched the active secret and active 30-second period before touching DOM. That ambiguity made stale render possible.

## Lessons Learned

For time-windowed auth UI, never render async output unless it proves it still belongs to current input and current time bucket. Copy/status feedback must be cosmetic only; it cannot become a hidden state restore mechanism. Keep canonical normalized input, then derive everything else from it.

## Next Steps

- Owner: next developer touching 2FA UI.
- When: before any future TOTP behavior change.
- Add or keep browser-level regression coverage for changed-secret, empty-secret, boundary-crossing, and copy-feedback cases.
- Do not add docs sync now; docs impact none and project plan sync not needed.

## Unresolved Questions

None.
