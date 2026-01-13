# App Shell & Global Sidebar

## Purpose
The application previously used a top header for navigation, which consumed vertical space and didn't scale well for complex workflows. This feature introduces a responsive **Global Sidebar** layout. It maximizes screen real estate for chat interfaces, clearly separates "App Level" navigation from "Project Level" context, and provides a unified location for user controls.

## Summary
The new shell replaces the top header with a collapsible left sidebar on desktop and a mobile header with a drawer on smaller screens. 

- **Desktop**: A persistent left sidebar that can collapse to an icon-only mode (defaulting to collapsed) to save space.
- **Mobile**: A top header with a hamburger menu that opens the sidebar content in a slide-out drawer.
- **Unified Navigation**: Centralizes access to Inbox, Projects, and User Profile.

## Key Components
- **GlobalSidebar**: The main desktop navigation component. Handles collapse/expand logic and state persistence.
- **MobileHeader**: The mobile counterpart, displaying the logo and a hamburger menu trigger.
- **MainLayout**: The orchestrator that switches between desktop and mobile views and manages the main content area.
- **UserNav**: Refactored user menu (Avatar, Profile, Logout) located at the bottom of the sidebar.

## How It Works
1.  **Layout**: `MainLayout` uses a flexbox row container. The `GlobalSidebar` takes the left slot (desktop), and `MobileHeader` sits above the content (mobile).
2.  **State**: The sidebar's collapsed state (`isCollapsed`) is managed locally and persisted to `localStorage` (`sidebar-collapsed`).
3.  **Responsive Design**: CSS media queries (`hidden md:flex`) control visibility.
4.  **Navigation**: Clicking items uses standard `react-router-dom` navigation. Collapsed items show tooltips on hover.

## Related Documentation
- [Architecture](./architecture.md)
- [Decision Log](./decisions.md)
