# Architecture: Customizable Inbox Layout

## System Diagram

```mermaid
graph TD
    subgraph "Layout Structure"
        IL[InboxLayout.tsx] -->|md+ (Desktop)| RPG[ResizablePanelGroup]
        IL -->|< md (Mobile)| MobileView[Mobile Flex Layout]
    end

    subgraph "Desktop Layout (Resizable)"
        RPG -->|Persistence: 'inbox-layout-v1'| LS[localStorage]
        RPG --> PanelL[Left Panel: List]
        RPG --> Handle1[Handle]
        RPG --> PanelC[Center Panel: Chat]
        RPG --> Handle2[Handle]
        RPG --> PanelR[Right Panel: Visitor]
        
        PanelL --> CL[ConversationList]
        PanelC --> Outlet[Outlet / MessagePane]
        PanelR --> VCP[VisitorContextPanel]
    end

    subgraph "Mobile Layout"
        MobileView --> CL_Mobile[ConversationList]
        MobileView --> Outlet_Mobile[Outlet / MessagePane]
        Note[Stacked or Drawer-based navigation]
    end
```

## Components

### 1. `InboxLayout.tsx`
- **Location:** `packages/frontend/src/pages/inbox/InboxLayout.tsx`
- **Role:** The main container.
- **Responsibility:**
  - Determines render mode (Desktop vs. Mobile) using `useMediaQuery`.
  - Configures `ResizablePanelGroup` with `autoSaveId`.
  - Fetches current conversation data to conditionally render the `VisitorContextPanel`.

### 2. `VisitorContextPanel.tsx`
- **Location:** `packages/frontend/src/components/features/inbox/VisitorContextPanel.tsx`
- **Role:** Displays visitor metadata (Referrer, History, Device Info).
- **History:** Previously tightly coupled inside `MessagePane`. Now extracted for independent layout placement.

### 3. `Resizable UI`
- **Location:** `packages/frontend/src/components/ui/resizable.tsx`
- **Role:** Shared UI components.
- **Implementation:** Thin wrappers around `react-resizable-panels` adding project-specific styling (Grip icons, borders).

## Data Flow
1.  **Initialization:** `InboxLayout` mounts. `react-resizable-panels` checks `localStorage` for `inbox-layout-v1`.
    -   If found, applies saved widths.
    -   If not, uses `defaultSize` props.
2.  **Interaction:** User drags a handle.
3.  **Update:** Panels resize efficiently (using CSS transforms/flex-basis).
4.  **Persistence:** The library debounces the write to `localStorage`.

## Constraints & Invariants
- **Center Fluidity:** The Center panel (Chat) usually takes the remaining space after Left/Right constraints are met.
- **Min/Max Widths:**
    -   Left: Min 15%, Max 30%
    -   Right: Min 20%, Max 40%
-   **Mobile Fallback:** Resizing is strictly disabled on mobile to prevent touch conflicts and poor UX.
