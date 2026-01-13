# Customizable Inbox Layout

## Purpose
The Inbox layout was previously rigid, with fixed widths for the Conversation List, Chat Area, and Visitor Details. This inflexibility hindered users with different screen sizes or workflow preferences (e.g., needing more space to view code snippets or visitor metadata). This feature introduces a user-customizable, persistent layout system.

## Summary
The new layout allows users to:
1.  **Resize Columns:** Drag handles to adjust the width of the Conversation List, Chat Area, and Visitor Details.
2.  **Persist Preferences:** Layout adjustments are automatically saved to local storage and restored on subsequent visits.
3.  **Collapse Panels:** Quickly toggle the visibility of side panels.
4.  **Responsive Switching:** Automatically falls back to a mobile-optimized stacked view on smaller screens.

## Key Components
- **InboxLayout**: The orchestrator component that manages the `ResizablePanelGroup` and conditional rendering based on screen size.
- **VisitorContextPanel**: A standalone component extracted from the message pane, now independently managed by the layout.
- **Resizable Components**: Wrappers around `react-resizable-panels` (`ResizablePanel`, `ResizableHandle`) styled with Tailwind/shadcn.
- **useMediaQuery**: A hook to robustly detect screen size changes for desktop/mobile switching.

## How It Works
- **Library**: Uses `react-resizable-panels` for efficient, accessible resizing logic.
- **Persistence**: Leverages the library's `autoSaveId` prop to store layout percentages in `localStorage` under the key `inbox-layout-v1`.
- **Topology**:
  - **Left**: Conversation List (Collapsible, Min 15%, Max 30%)
  - **Center**: Message Pane (Fluid, Min 30%)
  - **Right**: Visitor Details (Conditional, Min 20%, Max 40%)

## Related Documentation
- [Architecture](./architecture.md)
- [Decision Log](./decisions.md)
