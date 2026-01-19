# Decision Log: App Shell & Global Sidebar

## Decision 1: Move from Top Header to Left Sidebar
- **Date:** 2025-12-13
- **Context:** The top header was taking up valuable vertical space, which is critical for chat applications (long message lists).
- **Decision:** Implement a Global Left Sidebar.
- **Rationale:**
  1.  **Vertical Space:** Maximizes the height available for the chat window.
  2.  **Scalability:** A sidebar handles a growing list of navigation items better than a horizontal header.
  3.  **Standard Pattern:** Matches modern SaaS/Chat app conventions (Slack, Discord, Linear).

## Decision 2: Default to Collapsed State
- **Date:** 2025-12-13
- **Context:** Screen real estate is precious. Users typically memorize icons quickly.
- **Decision:** The sidebar defaults to the collapsed (icon-only) state.
- **Rationale:**
  1.  **Focus:** Reduces visual noise.
  2.  **Space:** Keeps the layout compact, especially on smaller desktop screens (e.g., laptops).
  3.  **User Control:** Users can easily expand it if they need to read labels.

## Decision 3: Persist State in LocalStorage
- **Date:** 2025-12-13
- **Context:** If a user prefers the expanded sidebar, they shouldn't have to expand it every time they reload the page.
- **Decision:** Save the `isCollapsed` boolean in `localStorage` under `sidebar-collapsed`.
- **Rationale:**
  1.  **Persistence:** Remembers preference across sessions.
  2.  **Simplicity:** No need to store this UI preference in the backend database.

## Decision 4: Mobile Header + Drawer
- **Date:** 2025-12-13
- **Context:** A permanent sidebar doesn't work on mobile.
- **Decision:** Use a `MobileHeader` with a Hamburger menu that opens a slide-out drawer (`Sheet`).
- **Rationale:**
  1.  **Standard Mobile Pattern:** Intuitive for mobile users.
  2.  **Reuse:** The drawer content reuses the exact same navigation components as the desktop sidebar.

## Decision 5: Rename "Settings" to "My Profile"
- **Date:** 2025-12-13
- **Context:** "Settings" was ambiguous. It could mean "Project Settings" or "User Settings".
- **Decision:** Rename the user menu item to "My Profile".
- **Rationale:**
  1.  **Clarity:** Explicitly indicates this links to the user's personal account settings, distinguishing it from project/system configuration.
