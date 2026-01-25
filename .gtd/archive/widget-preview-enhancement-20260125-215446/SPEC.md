# Specification

**Status:** FINALIZED
**Created:** 2026-01-25

## Goal

Enhance the Widget Settings Preview to display the **entire** chat widget interface (Header, Message List, Composer, Launcher) instead of just message bubbles. This provides a "What You See Is What You Get" (WYSIWYG) experience for users configuring themes and text.

## Requirements

### Must Have

- [ ] **Full Component Rendering:** The preview must render the actual widget components:
    -   `Header` (with title, logo, close button)
    -   `MessageList` (with example conversation)
    -   `Composer` (with input area, send button, branding)
    -   `Launcher` (the floating button that opens the chat)
-   [ ] **Real-time Configuration Sync:** The preview must instantly reflect changes to:
    -   `theme` (Colors, Fonts, Shadows)
    -   `headerText`
    -   `welcomeMessage`
    -   `offlineMessage` (toggleable state in preview?)
    -   `companyLogoUrl`
    -   `agentDisplayName`
    -   `position` (Bottom-Left / Bottom-Right visualization)
-   [ ] **Theme Isolation:** The preview must correctly apply the selected theme's CSS variables locally, ensuring the preview looks correct even if the Dashboard itself is in a different theme (Light/Dark).
-   [ ] **Mock Data:** Use static mock messages for the preview (e.g., one visitor message, one agent message) to demonstrate the bubble styling.

### Nice to Have

- [ ] **Interactive Toggle:** A small toggle in the preview area to switch between "Online" and "Offline" states to preview the `offlineMessage` and offline composer state.
- [ ] **Mobile/Desktop Toggle:** A way to see how it looks on mobile vs desktop dimensions.

### Won't Have

-   Interactive chat functionality (sending messages in the preview).
-   Connecting to a real socket.

## Constraints

-   **Reusability:** Must reuse the **exact same components** (`Header.tsx`, `MessageList.tsx`, `Composer.tsx`) used in the actual `packages/frontend/src/widget/` application to ensure 1:1 visual parity.
-   **CSS Variables:** The preview container must act as a scope root (similar to Shadow DOM host) where the theme variables are injected.

## Open Questions

-   Should the `Launcher` be shown *alongside* the window, or as a separate preview state? (Assumption: Show the window open by default, maybe show launcher below or beside it).
