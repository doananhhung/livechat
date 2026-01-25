# Bug Symptom

**Reported:** 2026-01-25
**Status:** FIXED

## Expected Behavior

1. Initial load: newest 20 messages displayed
2. No auto-fetching without user scroll interaction
3. Scroll to top → older messages load ABOVE current messages
4. Final order: oldest at top, newest at bottom

## Actual Behavior (Before Fix)

1. Infinite fetch loop on conversation open
2. Messages loaded in wrong order (newest page first, older appended after)
3. Auto-fetching without scroll interaction
4. Backend limit parameter ignored (returned 51 instead of 20)

## Resolution

All issues resolved. See FIX_SUMMARY.md for details.
