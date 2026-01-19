# Changelog: App Shell & Global Sidebar

## 2025-12-13 - Initial Implementation
- **Slice:** app_shell_global_sidebar
- **What Changed:** Replaced the top `Header` navigation with a collapsible `GlobalSidebar` (desktop) and `MobileHeader` (mobile).
- **Files Modified:**
  - `packages/frontend/src/components/layout/GlobalSidebar.tsx` — **New**. Collapsible sidebar component.
  - `packages/frontend/src/components/layout/MobileHeader.tsx` — **New**. Mobile header with drawer.
  - `packages/frontend/src/components/layout/MainLayout.tsx` — Refactored to use sidebar layout.
  - `packages/frontend/src/components/layout/UserNav.tsx` — Added collapse support, renamed "Settings" to "My Profile".
  - `packages/frontend/src/pages/inbox/InboxLayout.tsx` — Updated layout styles (`h-full`).
  - `packages/frontend/src/components/layout/Header.tsx` — **Deleted**.
- **Tests Added:**
  - `packages/frontend/src/components/layout/GlobalSidebar.test.tsx`
  - `packages/frontend/src/components/layout/MobileHeader.test.tsx`
  - `packages/frontend/src/components/layout/MainLayout.test.tsx`
  - `packages/frontend/src/components/layout/UserNav.test.tsx`
  - `packages/frontend/src/pages/inbox/InboxLayout.test.tsx`
- **Reviewed By:** Reviewer (see `agent_workspace/app_shell_global_sidebar/code_reviews/app_shell_global_sidebar.md`)
- **Verified By:** Auto-verification during Action phase.
