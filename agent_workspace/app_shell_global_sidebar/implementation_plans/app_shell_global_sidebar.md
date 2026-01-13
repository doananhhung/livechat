# Implementation Plan: app_shell_global_sidebar

## 1. Acceptance Tests (What "Done" Looks Like)

> **CRITICAL:** Tests must be specific and actionable. Vague descriptions like
> "API works" are NOT acceptable. Each test must specify input, action, and expected output.

### Frontend

#### Unit Tests (Custom Hooks/Utilities)
- [ ] Test: `UserNav` renders "My Profile" menu item that navigates to `/settings/profile`.
- [ ] Test: `UserNav` renders "Log out" menu item.
- [ ] Test: `UserNav` renders in "collapsed" mode (avatar only) when `isCollapsed={true}`.
- [ ] Test: `UserNav` renders in "expanded" mode (avatar + details) when `isCollapsed={false}`.

#### Integration Tests (Components with Logic)
- [ ] Test: `<MainLayout />` renders `<GlobalSidebar />` when screen size is `md` or larger.
- [ ] Test: `<MainLayout />` renders `<MobileHeader />` when screen size is smaller than `md`.
- [ ] Test: `<GlobalSidebar />` renders in "collapsed" mode by default.
- [ ] Test: Clicking the toggle button in `<GlobalSidebar />` switches between collapsed and expanded states.
- [ ] Test: Collapsed state is persisted to `localStorage`.
- [ ] Test: In collapsed mode, navigation links show Tooltips on hover.
- [ ] Test: `<MobileHeader />` renders "Live Chat" title, a simplified `UserNav` (e.g., just the avatar), and a hamburger menu icon.
- [ ] Test: Clicking the hamburger menu icon in `<MobileHeader />` opens a `Sheet` component containing the content of `<GlobalSidebar />` in EXPANDED mode (always full width on mobile sheet).
- [ ] Test: `InboxLayout`'s main content area and sidebar (`aside` and `main` elements within `InboxLayout`) use `h-full` and adapt correctly to the parent's flexbox layout.

#### E2E Tests (Critical User Flows)
- [ ] Test: User navigates to `/inbox` on a desktop screen, `GlobalSidebar` is visible (collapsed by default), and the `InboxLayout` content fills the remaining screen space correctly.
- [ ] Test: User expands the sidebar, verifies text labels are visible.
- [ ] Test: User refreshes the page, sidebar remains in the last state (collapsed or expanded).
- [ ] Test: User navigates to `/inbox` on a mobile screen, `MobileHeader` is visible, `GlobalSidebar` is hidden, and clicking the hamburger icon opens the sidebar with correct content.

### Shared (if applicable)
- [ ] No shared components or types are expected to be added or modified in this slice.

## 2. Verification Commands
- [ ] Type Check: `npx tsc --noEmit`
- [ ] Frontend Unit/Integration Tests:
    - `npm test packages/frontend/src/components/layout/GlobalSidebar.test.tsx`
    - `npm test packages/frontend/src/components/layout/MobileHeader.test.tsx`
    - `npm test packages/frontend/src/components/layout/MainLayout.test.tsx`
    - `npm test packages/frontend/src/components/layout/UserNav.test.tsx`
    - `npm test packages/frontend/src/pages/inbox/InboxLayout.test.tsx`
- [ ] E2E Tests: (Will be run manually in browser or with a dedicated E2E tool once component integration is done to confirm visual layout and navigation flows.)

## 3. Implementation Approach
The implementation will involve creating new React components for the `GlobalSidebar` and `MobileHeader`. Existing layout components like `MainLayout` and `UserNav` will be modified to integrate the new sidebar and header, and `Header.tsx` will be removed. The `GlobalSidebar` will implement a collapsible state logic using `useState` and `localStorage`, toggled by a button. `Tooltip` components will be added for collapsed navigation items. `InboxLayout` will be updated to correctly integrate with the new `MainLayout`'s flexbox system.

## 4. Files to Create/Modify
- `packages/frontend/src/components/layout/GlobalSidebar.tsx` (Create) - Implements the desktop global navigation sidebar with collapse logic.
- `packages/frontend/src/components/layout/MobileHeader.tsx` (Create) - Implements the mobile header with a hamburger menu and app title.
- `packages/frontend/src/components/layout/UserNav.tsx` (Modify) - Updates the "Settings" menu item label to "My Profile" and adds `isCollapsed` prop support.
- `packages/frontend/src/components/layout/MainLayout.tsx` (Modify) - Integrates the new `GlobalSidebar` and `MobileHeader`, replacing the old `Header`.
- `packages/frontend/src/components/layout/Header.tsx` (Delete) - Removes the deprecated top header component.
- `packages/frontend/src/pages/inbox/InboxLayout.tsx` (Modify) - Adjusts height calculations to `h-full` to fit the new flexbox layout.

## 5. Dependencies
- `@/components/ui/sheet` (for mobile drawer)
- `@/components/ui/tooltip` (for collapsed sidebar)
- `react-router-dom` (for navigation)
- Lucide icons: `MessageSquare`, `Folder`, `User`, `LogOut`, `Settings`, `Menu`, `ChevronLeft`, `ChevronRight`, `PanelLeft`

## 6. Risk Assessment
- **Layout Shift:** This risk is explicitly addressed by the modification of `InboxLayout.tsx` to remove hardcoded height calculations. Thorough testing of the `InboxLayout` and its nested components will be crucial.
- **Navigation Confusion:** Mitigated by clarifying the "Settings" label to "My Profile" and using Tooltips in collapsed mode.
- **CSS Conflicts:** New flexbox and conditional rendering for desktop/mobile might introduce unforeseen CSS conflicts.
- **State Persistence:** Ensuring `localStorage` sync works correctly without causing hydration mismatches (though less of an issue with client-side rendering).