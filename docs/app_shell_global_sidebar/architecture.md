# Architecture: App Shell & Global Sidebar

## System Diagram

```mermaid
graph TD
    subgraph "Layout Composition"
        ML[MainLayout.tsx] -->|Desktop (md+)| GS[GlobalSidebar.tsx]
        ML -->|Mobile (<md)| MH[MobileHeader.tsx]
        ML -->|Content| Outlet[React Router Outlet]
    end

    subgraph "GlobalSidebar Components"
        GS -->|State: isCollapsed| Nav[Navigation Items]
        GS -->|Footer| UN[UserNav.tsx]
        GS -->|Toggle| TB[Toggle Button]
    end

    subgraph "MobileHeader Components"
        MH -->|Trigger| Sheet[Shadcn Sheet]
        Sheet -->|Content| GSC[GlobalSidebarContent]
        MH -->|Right| UN_Mobile[UserNav (Avatar Only)]
    end

    subgraph "State Persistence"
        GS -- Read/Write --> LS[localStorage: 'sidebar-collapsed']
    end
```

## Components

### 1. `MainLayout.tsx`
- **Location:** `packages/frontend/src/components/layout/MainLayout.tsx`
- **Responsibility:** Orchestrates the overall page structure. It detects screen size (via CSS classes) to toggle between `GlobalSidebar` and `MobileHeader`.
- **Structure:**
  ```tsx
  <div className="flex h-screen bg-background">
    <GlobalSidebar className="hidden md:flex" />
    <div className="flex-1 flex flex-col">
      <MobileHeader className="md:hidden" />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  </div>
  ```

### 2. `GlobalSidebar.tsx`
- **Location:** `packages/frontend/src/components/layout/GlobalSidebar.tsx`
- **Responsibility:** Desktop navigation.
- **Key Logic:**
  - Manages `isCollapsed` state (boolean).
  - Syncs state with `localStorage` to remember user preference.
  - Renders icons-only (w-16) or full text (w-64) based on state.
  - Uses `Tooltip` for usability when collapsed.

### 3. `MobileHeader.tsx`
- **Location:** `packages/frontend/src/components/layout/MobileHeader.tsx`
- **Responsibility:** Mobile navigation entry point.
- **Key Logic:**
  - Displays App Title and Hamburger Icon.
  - Opens a `Sheet` (drawer) containing the full navigation menu.

### 4. `UserNav.tsx`
- **Location:** `packages/frontend/src/components/layout/UserNav.tsx`
- **Responsibility:** User profile actions.
- **Updates:** Now accepts `isCollapsed` prop to conditionally hide the name/email text.

## Data Flow
- **Navigation:** Standard client-side routing.
- **Persistence:** LocalStorage is the source of truth for the sidebar state.
- **Responsiveness:** CSS Media Queries drive the layout switching, no complex JS resize listeners required.

## Error Handling
- **Hydration Mismatch:** The sidebar state initialization handles strictly client-side `localStorage` access to avoid SSR/hydration issues (if SSR were used, though this is a SPA).
- **Layout Overflow:** The `flex-1 overflow-auto` pattern ensures that if content grows, only the main area scrolls, keeping the sidebar fixed.
