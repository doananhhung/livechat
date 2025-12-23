
# Documentation: Widget Subsystem Internals

## 1. Architectural Overview

The Live Chat Widget is architected as a standalone **Micro-Frontend** application designed to be embedded into third-party websites. It is built using **Preact** for a minimal runtime footprint (~45KB gzipped) and utilizes **Socket.IO** for real-time bidirectional communication.

### Core Technologies
*   **Framework**: Preact (via `@preact/preset-vite`)
*   **State Management**: Zustand
*   **Transport**: Socket.IO Client
*   **Build Target**: IIFE (Immediately Invoked Function Expression) for single-file distribution (`app.js`).

---

## 2. Isolation Strategy & Shadow DOM

To ensure the widget does not visually break the host website (and vice versa), the application utilizes the **Shadow DOM** standard.

### 2.1 Shadow Root Encapsulation
The widget entry point (`main.tsx`) creates a host element `#live-chat-widget-host` and attaches a Shadow Root with `mode: 'open'`.
*   **Style Injection**: All component styles (Tailwind CSS compiled) are injected directly into the Shadow Root via a `<style>` tag.
*   **Event Retargeting**: Events originating from within the widget are retargeted to the host element, keeping internal DOM structure hidden.

### 2.2 Known Issue: CSS Leakage (Scrollbars)
**⚠️ Architectural Violation**
While the widget core is isolated, the `ChatWindow` component currently violates this isolation by injecting styles into the global `document.head`.

*   **Source**: `packages/frontend/src/widget/components/ChatWindow.tsx`
*   **Mechanism**: Appends a `<style>` tag containing selectors for `.theme-light ::-webkit-scrollbar` and `.theme-dark ::-webkit-scrollbar`.
*   **Impact**: If the host website uses classes named `.theme-light` or `.theme-dark` on their own elements, the widget's scrollbar styles will override the host's styles.
*   **Mitigation**: Host developers should avoid these specific class names or use `!important` to override widget leakage until this is refactored to use Shadow DOM `::part` or internal scrolling containers.

---

## 3. Initialization Lifecycle

The widget supports two initialization patterns: **Declarative Auto-Discovery** and **Imperative API**.

### 3.1 Auto-Discovery
On load, the script searches the DOM for a specific script tag:
```html
<script id="live-chat-widget" data-project-id="<ID>" ...>
```
If found, it extracts the `data-project-id` and automatically triggers the initialization sequence.

### 3.2 Global API (`window.LiveChatWidget`)
The widget exposes a global interface for Single Page Applications (SPAs) or conditional loading:

```typescript
interface LiveChatWidgetAPI {
  init: (config: { projectId: string; visitor?: VisitorData }) => Promise<void>;
  destroy: () => void;
}
```

### 3.3 Resilience: Exponential Backoff
The initialization process (`initializeWidget`) fetches configuration from the backend. If the API is unreachable, it implements a retry mechanism:
*   **Max Attempts**: 3
*   **Strategy**: Exponential Backoff (Delay * 2 for each retry).
*   **Fallback**: If all retries fail, a user-friendly error UI is rendered in the DOM.

---

## 4. SPA Context Tracking (History API Monkey-Patching)

To provide agents with real-time visibility into the visitor's navigation (Current URL), the widget must detect route changes in Single Page Applications (React, Vue, Angular) where the page does not fully reload.

### 4.1 The Monkey-Patching Strategy
Standard browser events (`popstate`, `hashchange`) do not fire when `history.pushState` is called programmatically. The widget overrides the native History API methods in `main.tsx`:

1.  **Capture**: Store references to `originalPushState` and `originalReplaceState`.
2.  **Override**: Replace `history.pushState` and `history.replaceState` with wrapper functions.
3.  **Dispatch**: The wrapper calls the original method, then dispatches a custom `window.dispatchEvent(new Event('urlchange'))`.

### 4.2 Event Aggregation
The `App` component listens to three events to cover all navigation scenarios:
1.  `popstate` (Browser Back/Forward)
2.  `hashchange` (Anchor navigation)
3.  `urlchange` (Custom event from monkey-patching)

When any of these fire, the widget emits an `updateContext` event to the Socket.IO server, provided the session is ready.

---

## 5. State Management: Circular Buffer Pattern

To prevent memory leaks in long-running sessions (e.g., a user keeps a tab open for days), the widget implements a **Bounded State Model** in `useChatStore.ts`.

### 5.1 The Problem
Unbounded arrays in JavaScript will eventually consume all available heap memory if messages continue to arrive indefinitely.

### 5.2 The Solution
The store enforces a strict limit on the `messages` array:
*   **Limit (`MAX_MESSAGES`)**: 500 messages.
*   **Threshold (`MESSAGE_CLEANUP_THRESHOLD`)**: 600 messages.

**Logic**:
```typescript
addMessage: (message) => set((state) => {
  const newMessages = [...state.messages, message];
  // Cleanup old messages if exceeding threshold
  if (newMessages.length > MESSAGE_CLEANUP_THRESHOLD) {
    return { messages: newMessages.slice(-MAX_MESSAGES) };
  }
  return { messages: newMessages };
})
```
This ensures the memory footprint remains constant regardless of session duration.

---

## 6. Client-Side Security Measures

The widget operates in a hostile environment (the public web) and implements defense-in-depth strategies.

### 6.1 DOM-Based Sanitization
To prevent Cross-Site Scripting (XSS) when rendering messages, the widget uses a browser-native sanitization technique in `Message.tsx`:

```typescript
function sanitizeContent(content: string): string {
  const div = document.createElement("div");
  div.textContent = content; // Browser automatically escapes HTML entities
  return div.innerHTML.replace(/\n/g, "<br>"); // Restore line breaks safely
}
```
*   **Input**: `<script>alert(1)</script>`
*   **Output**: `&lt;script&gt;alert(1)&lt;/script&gt;`
*   **Result**: The script renders as text but never executes.

### 6.2 Client-Side Rate Limiting
To prevent abuse and reduce load on the backend, the `Composer` component implements a Token Bucket-like limiter:
*   **Limit**: 10 messages.
*   **Window**: 60 seconds.
*   **Implementation**: A `useRef` array stores timestamps of sent messages. On every send attempt, timestamps older than 60s are filtered out. If the array length exceeds 10, the send action is blocked, and an error is displayed to the user immediately.

### 6.3 Input Validation
*   **Max Length**: Messages are strictly capped at 5000 characters.
*   **Empty Check**: Whitespace-only messages are blocked from submission.
