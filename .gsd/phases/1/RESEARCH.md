# Research: Form Synchronization & Consistency

## Problem Analysis

1. **"The dashboard don't know"**:
   - Backend emits `WebSocketEvent.FORM_SUBMITTED` via `EventsGateway`.
   - Frontend `SocketContext.tsx` does **not** listen for this event.
   - Thus, the dashboard (agent) does not receive the new `form_submission` message in real-time.

2. **"Dashboard has both pending and submitted (inconsistent)"**:
   - `FormRequestBubble.tsx` defaults status to "pending" unless expired.
   - It has a `TODO` to check for submission overlap, but currently lacks logic to know if it has been answered.
   - Result: Old "Form Request" bubble stays "Pending" even after the "Form Submission" bubble appears.

## Proposed Solution

### 1. Backend: Metadata Synchronization

- Modify `ActionsService.submitFormAsVisitor` to update the original `form_request` message's metadata.
- Set `metadata.ref_submission_id` or similar.
- This ensures persistence: loading history will show the correct state.

### 2. Frontend: Real-time Event Handling

- Update `SocketContext.tsx` to listen for `WebSocketEvent.FORM_SUBMITTED`.
- Implementation:
  - Add the new `form_submission` message to the React Query cache (append to messages).
  - **Crucially**: Update the existing `form_request` message in the cache to mark it as submitted (updating its metadata).

### 3. Frontend: Component Logic

- Update `FormRequestBubble.tsx` to check `metadata.submissionId` (or similar field we add).
- If present, render the "Submitted" state instead of "Pending".

## Implementation Details

### Validated Files

- `packages/backend/src/actions/actions.service.ts`: Needs update to `submitFormAsVisitor` (transactional metadata update).
- `packages/frontend/src/contexts/SocketContext.tsx`: Needs `FORM_SUBMITTED` listener.
- `packages/frontend/src/components/features/inbox/FormRequestBubble.tsx`: Needs status logic update.
- `packages/backend/src/gateway/events.gateway.ts`: Verify payload includes `formRequestMessageId` (it is available in context).

### Data Flow

1. Visitor submits form.
2. Backend validates, saves submission, saves submission message.
3. Backend **updates** request message metadata (`submissionId`).
4. Backend emits `FORM_SUBMITTED` with `formRequestMessageId`.
5. Frontend socket receives event.
6. Frontend updates `messages` cache: ads new message, updates old message metadata.
7. UI updates: Request bubble becomes "Submitted" (green check), Submission bubble appears below.
