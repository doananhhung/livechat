# Changelog: Customizable Inbox Layout

## 2025-12-14 - Initial Implementation
- **Slice:** inbox_customizable_layout
- **What Changed:** Replaced fixed-width Inbox columns with a user-resizable, persistent layout system.
- **Files Modified:**
  - `packages/frontend/src/pages/inbox/InboxLayout.tsx` — **Refactor**. Implemented `ResizablePanelGroup`.
  - `packages/frontend/src/components/ui/resizable.tsx` — **New**. Wrapper components for the library.
  - `packages/frontend/src/components/features/inbox/VisitorContextPanel.tsx` — **New**. Extracted from `MessagePane`.
  - `packages/frontend/src/components/features/inbox/MessagePane.tsx` — **Refactor**. Removed internal Visitor Panel.
  - `packages/frontend/src/hooks/use-media-query.ts` — **New**. Hook for responsive logic.
  - `packages/frontend/package.json` — Added `react-resizable-panels`.
- **Tests Added:**
  - `packages/frontend/src/pages/inbox/InboxLayout.test.tsx`
  - `packages/frontend/src/components/features/inbox/VisitorContextPanel.test.tsx`
- **Reviewed By:** Reviewer (see `agent_workspace/inbox_customizable_layout/code_reviews/inbox_layout.md`)
- **Verified By:** Auto-verification during Action phase.
