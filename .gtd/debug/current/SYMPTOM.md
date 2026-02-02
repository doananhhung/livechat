# Bug Symptom

**Reported:** 2026-02-02
**Status:** CONFIRMED

## Expected Behavior

When agent clicks send button or presses Enter in the message composer, a POST request should be made to `/inbox/conversations/:id/messages` and the message should appear in the conversation.

## Actual Behavior

Nothing happens. No network request is made, no loading state, no error displayed. The send action appears completely disconnected from any backend call.

## Reproduction Steps

1. Login as agent
2. Open any conversation
3. Type a message in composer
4. Click send button or press Enter
5. Observe: no request made, nothing happens

## Conditions

- Happens on ALL conversations (new and existing)
- Was working previously (broken sometime in last ~20 commits)

## Environment

- **Environment:** dev
- **Version/Commit:** unknown (within last 20 commits)
- **Recent Changes:** unknown

## Additional Context

- Backend endpoint exists and is correct: `POST /inbox/conversations/:id/messages`
- No console errors when attempting to send
- No network activity visible in DevTools
