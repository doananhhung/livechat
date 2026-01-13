# Design: App Shell & Global Sidebar

## 1. Context & Objective

Currently, the application uses a top `Header.tsx` for navigation and user controls. This limits screen real estate for vertical content (like chat lists) and doesn't scale well for complex navigation.

**Objective:**
1.  **Replace Top Header:** Move navigation to a **Global Left Sidebar**.
2.  **Clear Navigation Hierarchy:** Separate "App Level" navigation from "Project Level" context.
3.  **Unified User Controls:** Consolidate User Profile, Theme, and Logout into a consistent footer in the sidebar.
4.  **Collapsible Sidebar:** Allow users to collapse the sidebar to icon-only mode to maximize screen space.

## 2. Layout Topology

**New Layout Structure (`MainLayout.tsx`):**
```text
+----------------+--------------------------------------------------+
| Global Sidebar | Main Content Area (Outlet)                       |
| (Dynamic Width)| (Flex-1, Scrollable)                             |
|                |                                                  |
| [Logo]         |                                                  |
|                |                                                  |
| [Inbox]        |  +-------------------+-----------------------+   |
| [Projects]     |  | Inbox Sidebar     | Message Pane          |   |
|                |  | (Project List)    |                       |   |
|                |  |                   |                       |   |
|                |  +-------------------+-----------------------+   |
|                |                                                  |
| [User Nav]     |                                                  |
+----------------+--------------------------------------------------+
```

## 3. Component Design

### 3.1. `GlobalSidebar.tsx`

*   **Location:** `packages/frontend/src/components/layout/GlobalSidebar.tsx`
*   **State:**
    *   `isCollapsed`: Boolean. **Default: `true`**.
    *   **Storage:** Persist preference in `localStorage` (`sidebar-collapsed`).
*   **Styling:**
    *   **Desktop:** Visible only on medium and larger screens (`md:flex`).
    *   **Width:** Dynamic based on state.
        *   **Collapsed:** `w-16` (Icons only).
        *   **Expanded:** `w-64` (Full text).
        *   *Transition:* Smooth width transition (`transition-all duration-300 ease-in-out`).
    *   **Mobile:** Hidden (`hidden`). Content reused in `MobileHeader.tsx`.
*   **Behavior (Collapsed Mode):**
    *   Hide "Live Chat" text in Header (show Logo only).
    *   Hide navigation labels (Inbox, Projects).
    *   **Tooltips:** On hover, show label in a Tooltip (`@/components/ui/tooltip`).
*   **Sections:**
    1.  **Header:** App Logo / Title.
        *   *Collapsed:* Logo Icon only (centered).
        *   *Expanded:* Logo + "Live Chat" text.
    2.  **NavContent:**
        *   **Inbox:** Icon (`MessageSquare`) -> Link to `/inbox`.
        *   **Projects:** Icon (`Folder`) -> Link to `/settings/projects`.
    3.  **Footer:**
        *   **Toggle Button:** A chevron/icon button to toggle `isCollapsed` state (`ChevronLeft` when expanded / `ChevronRight` when collapsed, or `PanelLeft`).
        *   **UserNav:**
            *   *Collapsed:* Avatar only.
            *   *Expanded:* Avatar + Name + Email.

### 3.2. `MobileHeader.tsx` (New Component)

*   **Location:** `packages/frontend/src/components/layout/MobileHeader.tsx`
*   **Styling:** `h-16`, `bg-background`, `border-b`. Visible only on small screens (`md:hidden`).
*   **Content:**
    *   **Hamburger Icon:** Opens a `Sheet` component (`@/components/ui/sheet`).
    *   **Sheet Content:** Renders the *internal content* of `GlobalSidebar.tsx` (Logo, NavContent, Footer) in **Expanded Mode**.
    *   **App Title:** "Live Chat".
    *   **UserNav:** A simplified `UserNav` (avatar only) that triggers its dropdown.

### 3.3. `UserNav.tsx` Refactor

*   **Changes:**
    *   Rename "Settings" menu item to **"My Profile"** (Clarity).
    *   Ensure it navigates to `/settings/profile`.
    *   Keep "Log out".
    *   **Props:** Add `isCollapsed?: boolean` prop to control rendering (Avatar only vs Avatar+Info).

### 3.4. `MainLayout.tsx` Refactor

*   **Changes:**
    *   Remove `<Header />`.
    *   Import `<GlobalSidebar />` and `<MobileHeader />`.
    *   Structure:
        ```tsx
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Desktop Sidebar */}
          <GlobalSidebar className="hidden md:flex" /> 

          <div className="flex flex-col flex-1 overflow-auto">
            {/* Mobile Header */}
            <MobileHeader className="md:hidden" /> 
            
            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>
        ```

## 4. Implementation Plan

### 4.1. Dependencies
*   Existing Lucide icons (`MessageSquare`, `Folder`, `User`, `LogOut`, `Settings`, `Menu`, `ChevronLeft`, `ChevronRight`, `PanelLeft`).
*   Existing `react-router-dom`.
*   `@/components/ui/sheet` for mobile drawer.
*   `@/components/ui/tooltip` for collapsed sidebar tooltips.

### 4.2. File Changes

1.  **Create** `packages/frontend/src/components/layout/GlobalSidebar.tsx`.
2.  **Create** `packages/frontend/src/components/layout/MobileHeader.tsx`.
3.  **Modify** `packages/frontend/src/components/layout/UserNav.tsx`:
    *   Change label "Settings" -> "My Profile".
    *   Support `isCollapsed` prop.
4.  **Modify** `packages/frontend/src/components/layout/MainLayout.tsx`:
    *   Swap Header for Sidebar, integrate MobileHeader.
5.  **Delete** `packages/frontend/src/components/layout/Header.tsx`.
6.  **Modify** `packages/frontend/src/pages/inbox/InboxLayout.tsx`:
    *   Remove manual height calculation (`h-[calc(100vh-5rem)]`) and rely on parent flexbox. The `aside` and `main` within `InboxLayout` should use `h-full` or equivalent.
    *   The `aside` in `InboxLayout` currently uses `w-full md:w-1/3 max-w-sm`. This will need adjustment to fit within the new `MainLayout`'s flex-1 content area, typically `w-full`.

## 5. Mobile Considerations
*   **Mobile Navigation:** The `MobileHeader` will provide the entry point to the sidebar's content via a hamburger menu in a `Sheet`.
*   **`UserNav` on Mobile:** `UserNav` will appear in both the `MobileHeader` directly and within the `Sheet` (as part of `GlobalSidebar`'s content). Ensure its styling adapts.

## 6. Pre-Mortem (Risks)

1.  **Layout Shift:** Removing the top header changes the viewport height.
    *   *Impact:* `InboxLayout` calculates height `h-[calc(100vh-5rem)]`.
    *   *Fix:* With a sidebar layout, `MainLayout` sets the height. `InboxLayout` should be `h-full`. We must update `InboxLayout` to remove manual height calculations and rely on flexbox.
2.  **Navigation Confusion:** Users looking for "Settings" might get lost.
    *   *Fix:* Explicit naming ("My Profile" vs "Project Settings").
3.  **Tooltip Flickering:** Rapid mouse movement over collapsed sidebar.
    *   *Fix:* Use `TooltipProvider` with a delay.

## 7. Self-Audit

*   **Gall's Law:** We are restructuring the shell. Simple flexbox replacement.
*   **Reversibility:** Low risk. Component swap.
*   **Completeness:** Addressed the missing `InboxLayout.tsx` modification and specified the `MobileHeader.tsx` component and its integration. Added Collapsible Sidebar specs.
*   **Explicit Boundaries:** Clearly defined the role of `GlobalSidebar.tsx` (desktop) and `MobileHeader.tsx` (mobile) and how they reuse content.