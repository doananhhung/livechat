# Changelog: Conversation Assignment

## 2025-12-12 - Frontend Assignment (Slice 2)
- **Slice:** `frontend_assignment`
- **What Changed:** Implemented UI for assigning conversations.
- **Files Modified/Created:**
  - `packages/shared-types/src/conversation.types.ts`: Added fields.
  - `packages/frontend/src/services/inboxApi.ts`: Added hooks.
  - `packages/frontend/src/components/features/inbox/AssignmentControls.tsx`: New component.
  - `packages/frontend/src/components/features/inbox/MessagePane.tsx`: Integration.
  - `packages/frontend/src/components/features/inbox/ConversationList.tsx`: Added avatar.
  - `packages/frontend/src/contexts/SocketContext.tsx`: Real-time handling.
- **Features:**
  - "Assign to Me" button.
  - Optimistic UI updates.
  - Real-time sync across clients.
- **Reviewed By:** Reviewer (see `agent_workspace/conversation_assignment/code_reviews/frontend_assignment.md`)
- **Verified By:** Architect (see `agent_workspace/conversation_assignment/handoffs/frontend_assignment.md`)

## 2025-12-12 - Initial Implementation (Slice 1)
- **Slice:** `assignment_engine`
- **What Changed:** Added ability to assign/unassign conversations.
- **Files Modified:**
  - `packages/backend/src/database/entities/conversation.entity.ts`: Added `assigneeId` and `assignedAt`.
  - `packages/backend/src/inbox/assignments.controller.ts`: Created new controller.
  - `packages/backend/src/inbox/services/conversation.service.ts`: Added `assign` and `unassign` logic.
  - `packages/backend/src/inbox/dto/assign-conversation.dto.ts`: Created DTO.
  - `packages/backend/test/assignments.e2e-spec.ts`: Added E2E tests.
- **Events:**
  - `CONVERSATION_UPDATED`: Emitted when assignment changes.
- **Reviewed By:** Reviewer (see `agent_workspace/conversation_assignment/code_reviews/assignment_engine.md`)
- **Verified By:** Architect (see `agent_workspace/conversation_assignment/handoffs/assignment_engine.md`)