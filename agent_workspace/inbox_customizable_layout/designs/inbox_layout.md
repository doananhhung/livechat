# Design: Customizable Inbox Layout

## 1. Context & Objective

Currently, the Inbox layout (`/inbox/projects/:id`) relies on hardcoded CSS widths (e.g., `w-64`, `w-80`). Users cannot adjust these widths to suit their screen size or workflow preference (e.g., widening the chat area to see code snippets, or hiding the visitor details to focus).

**Objective:**
1.  **Resizable Columns:** Allow users to drag the boundaries between the Conversation List, Chat Area, and Visitor Details.
2.  **Collapsible Panels:** Allow users to quickly toggle visibility of the Conversation List and Visitor Details.
3.  **Persistence:** Remember the user's preferred layout (widths and collapsed state) in `localStorage` per project/user context.

## 2. Domain Physics (Invariants)

1.  **Layout Topology:** `[Conversation List] | [Chat Area] | [Visitor Details]`
2.  **Constraint:** The Chat Area (Center) is the "Fluid" column. It takes up remaining space.
3.  **Constraint:** The Side panels have `min-width` and `max-width` constraints to prevent UI breakage.
4.  **Persistence Key:** `inbox-layout-v1` (stored in `localStorage`).

## 3. UI/UX Specifications

### 3.1. Libraries
We will adopt **`react-resizable-panels`**.
*   *Why?* It is the industry standard for React layouts (used by Vercel, VS Code web, shadcn/ui). It handles accessibility (keyboard resizing), persistence, and constraints natively.
*   *Size:* Lightweight (~4kb gzipped).

### 3.2. Component Structure

We will refactor `packages/frontend/src/pages/inbox/InboxPage.tsx` (or the equivalent layout root).

```tsx
<ResizablePanelGroup direction="horizontal">
  {/* Left: Conversation List */}
  <ResizablePanel 
    defaultSize={20} 
    minSize={15} 
    maxSize={30} 
    collapsible={true}
    onCollapse={...}
  >
    <ConversationList />
  </ResizablePanel>

  <ResizableHandle withHandle />

  {/* Center: Message Area */}
  <ResizablePanel defaultSize={55} minSize={30}>
    <MessagePane />
  </ResizablePanel>

  <ResizableHandle withHandle />

  {/* Right: Visitor Details (Only renders if conversation selected) */}
  {selectedConversation && (
    <ResizablePanel 
      defaultSize={25} 
      minSize={20} 
      maxSize={40} 
      collapsible={true}
    >
      <VisitorContextPanel />
    </ResizablePanel>
  )}
</ResizablePanelGroup>
```

### 3.3. Interaction Details

*   **Drag:** Users drag the separator line (Handle) to resize.
*   **Click:** A small "Chevron" icon on the Handle allows quick collapsing. (Note: `react-resizable-panels` handles do not natively have click-to-collapse, so we may need a separate button in the header or a custom handle component).
*   **State Restoration:** On page load, the component reads `localStorage` and applies the saved percentages.

## 4. Implementation Plan

### 4.1. Dependencies
*   `npm install react-resizable-panels`

### 4.2. File Changes

1.  **`packages/frontend/src/components/ui/resizable.tsx`**:
    *   Create a wrapper for `react-resizable-panels` components (Panel, Group, Handle) styled with Tailwind (following shadcn/ui pattern) to match our design system.

2.  **`packages/frontend/src/layout/InboxLayout.tsx`**:
    *   Create a new layout component that replaces the hardcoded flexbox structure.
    *   Integrate the `ResizablePanelGroup`.
    *   Add persistence logic (`storage={localStorage}`).

3.  **`packages/frontend/src/components/features/inbox/MessagePane.tsx`**:
    *   **Refactor:** Remove the `aside` wrapper from `VisitorContextPanel`. It should just be the content. The `ResizablePanel` will act as the wrapper.
    *   **Refactor:** Remove hardcoded widths (`w-64`, etc).

## 5. Pre-Mortem (Risks)

1.  **Mobile Responsiveness:** Resizable panels are terrible on mobile.
    *   *Mitigation:* We will disable the resizable group on mobile screens (`md` breakpoint) and fall back to the existing stacked/drawer layout. `react-resizable-panels` supports conditional rendering or we can use CSS media queries to hide the handles.
2.  **Flash of Unstyled Content (FOUC):** The layout might "jump" on load before reading storage.
    *   *Mitigation:* `react-resizable-panels` handles this well if `defaultSize` is sensible. SSR is not a major concern for this SPA.
3.  **Visitor Panel Conditional:** The 3rd panel only exists when a conversation is selected.
    *   *Logic:* When the 3rd panel is added/removed, the percentages of the other two must adjust. The library handles "distributing" space, but we need to ensure the middle panel takes the hit, not the left one.

## 6. Testability

*   **Unit:** Verify `localStorage` is written to when `onLayout` is called.
*   **E2E:** Playwright test to drag the handle and verify the width changes.

## 7. Self-Audit

*   **Gall's Law:** We are replacing a rigid structure with a flexible one using a battle-tested library. We are avoiding writing our own drag-math logic.
*   **Reversibility:** If users hate it, we can revert the `InboxLayout.tsx` change easily.
