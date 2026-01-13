# Implementation Plan: Customizable Inbox Layout

## 1. Acceptance Tests

### Backend

- N/A (Frontend only)

### Frontend

#### Unit Tests (Components)

- [ ] Test: `VisitorContextPanel` renders correctly when passed a conversation object.
- [ ] Test: `InboxLayout` renders `ResizablePanelGroup` on desktop.
- [ ] Test: `InboxLayout` renders fallback layout on mobile (or hides panels appropriately).

#### E2E Tests (Playwright)

- [ ] Test: Dragging the handle between Conversation List and Message Pane resizes both panels.
- [ ] Test: Dragging the handle between Message Pane and Visitor Details resizes both panels.
- [ ] Test: Collapsing the Conversation List (if implemented) hides it.
- [ ] Test: Reloading the page persists the panel sizes (from `localStorage`).
- [ ] Test: Navigating to a conversation shows the Visitor Details panel.
- [ ] Test: Navigating to `/inbox` (no conversation) hides the Visitor Details panel.

## 2. Verification Commands

- [ ] Unit Tests: `npm test packages/frontend/src/pages/inbox/InboxLayout.test.tsx` (and `VisitorContextPanel.test.tsx` if created)
- [ ] Type Check: `npx tsc --noEmit`
- [ ] Build: `npm run build`

## 3. Implementation Approach

1.  **Extract Components:** Move `VisitorContextPanel` from `MessagePane.tsx` to a dedicated `VisitorContextPanel.tsx` file to allow reuse in `InboxLayout`.
2.  **Install Library:** Add `react-resizable-panels` to dependencies.
3.  **Create UI Wrappers:** Create `src/components/ui/resizable.tsx` wrapping the library components with Tailwind styles (shadcn/ui pattern).
4.  **Refactor InboxLayout:**
    - Implement `useMediaQuery` or similar logic to detect Desktop vs Mobile.
    - On Desktop: Render `ResizablePanelGroup` with 3 panels:
      1.  Conversation List (Left)
      2.  Outlet (Center - MessagePane)
      3.  VisitorContextPanel (Right - Conditional)
    - Implement `onLayout` callback to save sizes to `localStorage`.
    - Add data fetching logic to `InboxLayout` to retrieve the current conversation (needed for `VisitorContextPanel`).
5.  **Refactor MessagePane:**
    - Remove internal `VisitorContextPanel` rendering.
    - Clean up layout classes to fit within the `Outlet` container.

## 4. Files to Create/Modify

- `packages/frontend/package.json` — Add `react-resizable-panels`.
- `packages/frontend/src/components/ui/resizable.tsx` — New component.
- `packages/frontend/src/components/features/inbox/VisitorContextPanel.tsx` — Extracted component.
- `packages/frontend/src/components/features/inbox/MessagePane.tsx` — Remove VisitorContextPanel.
- `packages/frontend/src/pages/inbox/InboxLayout.tsx` — Implement resizable layout.
- `packages/frontend/src/pages/inbox/InboxLayout.test.tsx` — Test the new layout logic.

## 5. Dependencies

- `react-resizable-panels`
- `lucide-react` (Icons for handles)

## 6. Risk Assessment

- **Mobile Responsiveness:** `react-resizable-panels` can be tricky on mobile. We will strictly conditionally render it only for `min-width: 768px` (md breakpoint) and use the existing "Show/Hide" logic for mobile.
- **Data Sync:** Hoisting `VisitorContextPanel` requires `InboxLayout` to have the conversation data. We will reuse the React Query cache to avoid double-fetching network requests, but we need to ensure the correct conversation is selected.
