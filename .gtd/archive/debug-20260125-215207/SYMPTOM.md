# Bug Symptom

**Reported:** 2026-01-25
**Status:** CONFIRMED

## Expected Behavior

When an agent opens an existing conversation with more than 20 messages and scrolls to the top of the message list, the system should trigger pagination to fetch and display older messages from the history.

## Actual Behavior

Only the most recent 20 messages are visible. Scrolling up does not trigger the loading of older messages, and no additional messages appear.

## Reproduction Steps

1. Log in to the Dashboard.
2. Open a conversation with a known history of more than 20 messages (ensure it's loaded fresh from the backend).
3. Scroll to the top of the message list in the `MessagePane`.
4. Observe that the list stops at the 20th message and no further messages are loaded.

## Conditions

- Affects all conversations with > 20 messages.
- No error messages are present in the browser console.
- Specifically affects the Dashboard (Agent view).

## Environment

- **Environment:** Development/Production Dashboard
- **Recent Changes:** Unified Theme & Optimistic UI (2026-01-25)

## Additional Context

The codebase overview mentions cursor-based pagination in the `inbox` module and that `MessagePane.tsx` implements optimistic UI. The issue likely resides in the intersection of the scroll-to-load logic and the recent optimistic UI/theming changes.
