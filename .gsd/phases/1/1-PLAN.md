---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Real-time Form Synchronization

## Objective

Implement real-time updates for form submissions on the dashboard and ensure consistent state (removing "pending" status) when a form is submitted.

## Context

- .gsd/SPEC.md
- .gsd/phases/1/RESEARCH.md
- packages/backend/src/actions/actions.service.ts
- packages/frontend/src/contexts/SocketContext.tsx
- packages/frontend/src/components/features/inbox/FormRequestBubble.tsx

## Tasks

<task type="auto">
  <name>Update Backend Submission Logic</name>
  <files>
    packages/backend/src/actions/actions.service.ts
    packages/backend/src/actions/actions.service.spec.ts
  </files>
  <action>
    - Modify `submitFormAsVisitor` in `actions.service.ts`:
      - Fetch the `formRequestMessage` inside the transaction.
      - Update `formRequestMessage.metadata` to include `submissionId: savedSubmission.id` and `submittedAt: new Date()`.
      - Save the updated `formRequestMessage` transactionally.
    - Update `actions.service.spec.ts` to verify `formRequestMessage` metadata is updated.
  </action>
  <verify>
    npm run test packages/backend/src/actions/actions.service.spec.ts
  </verify>
  <done>
    Unit tests pass AND code shows transactional update of request message.
  </done>
</task>

<task type="auto">
  <name>Implement Frontend Event Handling</name>
  <files>
    packages/frontend/src/contexts/SocketContext.tsx
    packages/frontend/src/components/features/inbox/FormRequestBubble.tsx
  </files>
  <action>
    - Update `SocketContext.tsx`:
      - Add listener for `WebSocketEvent.FORM_SUBMITTED`.
      - Handler should:
        1. Append the new submission message to the conversation messages cache.
        2. Find the original `formRequestMessage` (by `payload.messageId` or searching cache) and update its metadata to include `submissionId`.
    - Update `FormRequestBubble.tsx`:
      - Check `metadata.submissionId` or `metadata.submittedAt`.
      - If present, render the "Submitted" state (Green Check) instead of "Pending".
  </action>
  <verify>
    npm run dev:frontend
  </verify>
  <done>
    Manual verification: Submit form as visitor -> Dashboard shows "Submitted" status instantly without reload.
  </done>
</task>

## Success Criteria

- [ ] Backend updates form request metadata on submission.
- [ ] Dashboard `SocketContext` receives and processes `FORM_SUBMITTED` event.
- [ ] Dashboard UI updates "Pending" form bubble to "Submitted" state in real-time.
- [ ] No duplicate "pending" and "submitted" states for the same form.
