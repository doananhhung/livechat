# Action Log: app_shell_global_sidebar

## Implementation Summary
- **Created** `GlobalSidebar.tsx` serving as the collapsible desktop navigation.
    - Implemented collapse/expand logic with `localStorage` persistence (key: `sidebar-collapsed`).
    - Added a toggle button using `ChevronLeft`/`ChevronRight`.
    - Integrated `Tooltip` for navigation items when collapsed.
- **Created** `MobileHeader.tsx` for mobile navigation, reusing `GlobalSidebarContent` in an always-expanded state within a Sheet.
- **Refactored** `MainLayout.tsx` to use the new sidebar layout.
- **Updated** `UserNav.tsx`:
    - Renamed "Settings" to "My Profile".
    - Added `isCollapsed` prop to hide user details in collapsed mode while keeping the avatar.
- **Updated** `InboxLayout.tsx` to use flexbox for height management (`h-full`), removing hardcoded calculations.
- **Installed** `tooltip` component from shadcn/ui.
- **Fixed** TypeScript errors (`TS2698`, `TS2339`) in test files by improving mock types.
- **Updated** `@types/react` and `@types/react-dom` to resolve React 19 compatibility issues.

## Verification
- **Type Check:** Passed (`npx tsc --noEmit`).
- **Tests:** All 50 tests passed.
    - Verified Sidebar collapse/expand behavior.
    - Verified state persistence.
    - Verified UserNav rendering in both states.
    - Verified MobileHeader always expands content.

## Manual Verification Notes
- Confirmed `InboxLayout` uses `h-full` to fill the available space.
- Confirmed `MobileHeader` is visible only on small screens (`md:hidden`).
- Confirmed `GlobalSidebar` is visible only on desktop (`hidden md:flex`) and defaults to collapsed.