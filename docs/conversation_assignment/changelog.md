# Changelog: Conversation Assignment

## 2025-12-12 - Initial Implementation
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
