---
created: 2026-01-25
root_cause: Backend double-save (SENDING -> SENT) creates a race condition where frontend reads intermediate state.
---

# Fix Plan

## Objective

Eliminate the race condition in `MessageService.sendAgentReply` by consolidating the message creation and status update into a single database transaction and save operation.

## Context

- `packages/backend/src/inbox/services/message.service.ts`: The service method `sendAgentReply` currently saves twice.
- `packages/backend/src/inbox/services/message.service.ts`: Needs refactoring.

## Architecture Constraints

- **Single Source:** Use the database as the source of truth for message status.
- **Atomicity:** Message creation and status assignment should happen atomically from the database perspective.
- **Consistency:** Event emission should ideally happen after the transaction commits (or at least after the data is prepared).

## Tasks

<task id="1" type="auto">
  <name>Refactor sendAgentReply to Single-Save</name>
  <files>packages/backend/src/inbox/services/message.service.ts</files>
  <action>
    Refactor `sendAgentReply`:
    1.  Inside the transaction:
        a.  Fetch conversation and visitor to get `visitorUid`.
        b.  Call `realtimeSessionService.getVisitorSession(visitorUid)` to check online status.
        c.  Determine initial status: `SENT` if socket exists, `DELIVERED` otherwise.
        d.  Create and save the message *once* with the final status.
        e.  Update conversation last message.
    2.  After the transaction:
        a.  Emit `agent.message.sent` event.
        b.  Schedule auto-pending job.
        c.  Return the saved message.
    
    *Note:* Ensure `getVisitorSession` is awaited properly within the transaction block.
  </action>
  <done>
    - Only one `entityManager.save(message)` call exists in the execution path.
    - Message status is correct (`SENT`/`DELIVERED`) upon creation.
  </done>
</task>

## Success Criteria

- [ ] Agent message creation involves only one DB write for the message entity.
- [ ] No "blink" or spinner regression in frontend.
- [ ] Events are still emitted correctly.

## Rollback Plan

Revert changes to `packages/backend/src/inbox/services/message.service.ts`.
