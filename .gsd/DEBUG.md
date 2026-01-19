# Debug Session: Widget Form Failures

## Symptom 1: Submission Rejected

**When:** Agent deletes conversation -> Visitor messages -> Agent sends form -> Visitor submits.
**Actual:** Backend logs `SUBMIT_FORM rejected: missing visitorId or conversationId`. Widget says "Session not ready".
**Hypothesis:** Widget state (conversationId) is stale after deletion; sending old ID or lacking new ID.

## Symptom 2: Widget Crash

**When:** After refreshing page (to fix Symptom 1) and submitting form.
**Actual:** Widget becomes blank with "Chat Widget Error".
**Hypothesis:** Backend `FORM_SUBMITTED` payload change (removing `sender` object) caused React runtime error in Widget when it tries to read `message.sender.type`.

## Evidence

- User log: `WARN [EventsGateway] SUBMIT_FORM rejected: missing visitorId or conversationId`
- Recent change: Replaced `sender: { type: ... }` with `senderId` in `events.gateway.ts`.
