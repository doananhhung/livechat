# Changelog: Visitor Name Editing

## 2025-12-14 - Initial Implementation
- **Slice:** visitor_name_editing
- **What Changed:** Added ability for agents to rename visitors.
- **Files Modified:**
  - `packages/backend/src/visitors/visitors.controller.ts` — Added `PATCH` endpoint.
  - `packages/backend/src/visitors/visitors.service.ts` — Added update logic and event emission.
  - `packages/backend/src/visitors/dto/update-visitor.dto.ts` — **New**. DTO for validation.
  - `packages/frontend/src/components/features/inbox/VisitorNameEditor.tsx` — **New**. Inline editor component.
  - `packages/frontend/src/components/features/inbox/RenameVisitorDialog.tsx` — **New**. Modal editor component.
  - `packages/frontend/src/features/inbox/hooks/useVisitorEvents.ts` — **New**. Socket listener.
  - `packages/frontend/src/features/inbox/VisitorContextPanel.tsx` — Integrated `VisitorNameEditor`.
  - `packages/frontend/src/features/inbox/ConversationList.tsx` — Integrated `RenameVisitorDialog`.
- **Tests Added:**
  - `packages/backend/test/visitors.e2e-spec.ts`
  - `packages/backend/src/visitors/__tests__/visitors.service.spec.ts`
  - `packages/frontend/src/components/features/inbox/VisitorNameEditor.spec.tsx`
  - `packages/frontend/src/components/features/inbox/RenameVisitorDialog.spec.tsx`
- **Reviewed By:** Reviewer (see `agent_workspace/visitor_name_editing/code_reviews/visitor_name_editing.md`)
- **Verified By:** Auto-verification during Action phase.
