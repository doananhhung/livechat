# Bug Symptom

**Reported:** 2026-01-25
**Status:** CONFIRMED

## Expected Behavior

1. User sends message.
2. Message appears immediately with 0.7 opacity + spinner (Optimistic).
3. Backend confirms.
4. Message updates to 1.0 opacity, spinner disappears (Sent).

## Actual Behavior

1. User sends message.
2. Message appears immediately (Optimistic).
3. **Wait...** (approx 1 second?)
4. Message "blinks" (UI thrash).
5. Message enters "Spinning" state again (or stays spinning).
6. After another ~1 second, it finally turns normal (Sent).

## Reproduction Steps

1. Open Inbox.
2. Send a message to a visitor.
3. Watch the message status indicator carefully.

## Conditions

- **Environment:** Admin Panel (MessagePane).
- **Recent Change:** Optimistic UI cache key fix applied.

## Additional Context

- The optimistic update sets `status: SENDING`.
- The mutation success _should_ return `SENT` or `DELIVERED`.
- Real-time socket events (`NEW_MESSAGE`) are also arriving.
- The "blink" suggests a conflict between `onSuccess` update and `onSettled` invalidation logic, or the socket event handling.
