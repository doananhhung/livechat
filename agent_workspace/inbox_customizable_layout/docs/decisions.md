# Decision Log: Customizable Inbox Layout

## Decision 1: Use `react-resizable-panels`
- **Date:** 2025-12-14
- **Context:** We needed a reliable way to implement resizable columns.
- **Decision:** Adopt `react-resizable-panels`.
- **Rationale:**
  1.  **Industry Standard:** Used by major React apps (Vercel, VS Code Web).
  2.  **Performance:** Uses efficient layout techniques to avoid jank.
  3.  **Features:** Built-in persistence (`autoSaveId`) and constraints (`minSize`, `maxSize`) saved us from writing complex custom logic.
  4.  **A11y:** Provides keyboard support for resizing.

## Decision 2: Extract `VisitorContextPanel`
- **Date:** 2025-12-14
- **Context:** `VisitorContextPanel` was hardcoded inside `MessagePane`. This made it impossible to place it in a separate resizable container managed by the parent layout.
- **Decision:** Extract it to a standalone component.
- **Rationale:**
  1.  **Separation of Concerns:** `MessagePane` should focus on messages. The Layout should manage the panels.
  2.  **Flexibility:** Allows the Visitor Panel to be toggled independently of the chat view.

## Decision 3: Disable Resizing on Mobile
- **Date:** 2025-12-14
- **Context:** Resizable panes are difficult to use on touch screens and often conflict with swipe gestures.
- **Decision:** Switch to a standard stacked/flex layout on mobile (`md` breakpoint and below).
- **Rationale:**
  1.  **UX:** Mobile screens are too narrow for 3 columns.
  2.  **Simplicity:** Avoids complex touch event handling.

## Decision 4: Use `useMediaQuery` for Layout Switching
- **Date:** 2025-12-14
- **Context:** We needed to strictly render different component trees for Desktop vs Mobile (Resizable Group vs Flex Div). CSS-only hiding leaves non-functional resizing logic in the DOM.
- **Decision:** Use a JS hook to conditionally render the tree.
- **Rationale:**
  1.  **Correctness:** Ensures the `ResizablePanelGroup` is not mounted on mobile, preventing potential bugs.
  2.  **Performance:** Reduces DOM weight on mobile.
