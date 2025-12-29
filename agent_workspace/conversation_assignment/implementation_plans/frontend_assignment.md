# Implementation Plan: frontend_assignment

## 1. Acceptance Tests (What "Done" Looks Like)

### UI Interaction Tests
- [ ] Test: Click "Assign to Me" -> UI optimistically updates to show my avatar -> API success confirms.
- [ ] Test: Click "Unassign" -> UI optimistically reverts to "Unassigned" -> API success confirms.
- [ ] Test: Conversation assigned to peer -> Shows peer's avatar and name.

### Realtime Tests
- [ ] Test: Another agent assigns conversation -> UI updates immediately (without refresh) to show their avatar.
- [ ] Test: Assignment removed remotely -> UI updates to "Unassigned".

### List View Tests
- [ ] Test: Conversation list item shows small avatar of assignee (or empty if unassigned).

## 2. Implementation Approach
1.  **Shared Types:** Update `Conversation` interface in `shared-types` to include `assigneeId`, `assignee`, `assignedAt`. **Rebuild shared-types.**
2.  **API Layer:** Add `useAssignConversation` and `useUnassignConversation` hooks to `inboxApi.ts` with optimistic updates.
3.  **Components:**
    *   Create `AssignmentControls` component (Header widget).
    *   Update `MessagePane` to include `AssignmentControls`.
    *   Update `ConversationList` to render assignee avatar.
4.  **Realtime:** Update `SocketContext` to listen for `CONVERSATION_UPDATED` and invalidate queries.

## 3. Files to Create/Modify
- `packages/shared-types/src/conversation.types.ts` — Add fields.
- `packages/frontend/src/services/inboxApi.ts` — Add hooks.
- `packages/frontend/src/components/features/inbox/AssignmentControls.tsx` — NEW component.
- `packages/frontend/src/components/features/inbox/MessagePane.tsx` — Integrate controls.
- `packages/frontend/src/components/features/inbox/ConversationList.tsx` — Add avatar.
- `packages/frontend/src/contexts/SocketContext.tsx` — Handle event.

## 4. Dependencies
- `radix-ui` (or existing UI library) for Popover/Dropdown (if needed).
- `lucide-react` for icons (`UserPlus`, `UserMinus`).

## 5. Risk Assessment
- **Cache Consistency:** Optimistic updates usually tricky. If API fails, UI must rollback. React Query handles this, but we must verify `onError` logic.
- **Missing Peer Data:** If `assignee` object is missing in realtime payload (we know it is), we rely on `invalidateQueries` to fetch full user details. This creates a small flicker/delay but ensures correctness.
