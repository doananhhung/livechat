# Research: Phase 1 - Dashboard Optimistic UI & Visual Cleanup

**Created:** 2026-01-25

## Findings

### 1. `MessagePane.tsx` Structure
- **Current State:**
  - Uses `useGetMessages` to fetch messages.
  - Groups messages by sender.
  - Renders bubbles using simple `div`s with conditional classes (`justify-start` vs `justify-end`).
  - Styling:
    - Visitor: `bg-muted text-muted-foreground rounded-tl-none`
    - Agent: `bg-primary text-primary-foreground rounded-tr-none`
  - **Missing:**
    - Visual feedback for `MessageStatus.SENDING` (opacity/spinner).
    - Visual feedback for `MessageStatus.FAILED` (error icon/retry).
    - Consistent `rounded-lg` with `rounded-tr-none` (currently `rounded-lg` is applied, need to verify exact pixel match with Widget).

### 2. `inboxApi.ts` Optimistic Logic
- **Current State:**
  - `useSendAgentReply` ALREADY implements optimistic updates!
  - It creates a temporary message with `status: MessageStatus.SENDING` and `id: uuidv4()`.
  - It pushes this to the React Query cache immediately.
  - On error, it updates status to `MessageStatus.FAILED`.
- **Gap:** The UI (`MessagePane.tsx`) receives this `SENDING` message but renders it exactly like a sent message. It ignores the `status` field completely.

### 3. Visual Parity Gap
- **Dashboard (Agent):** `bg-primary` (solid color), `text-primary-foreground`.
- **Widget (Visitor - "Me"):**
  - Uses `var(--widget-primary-gradient)` or `primaryColor` fallback.
  - `rounded-l-xl rounded-t-xl` (different radius).
- **Goal:**
  - Dashboard Agent needs to match Widget Visitor.
  - Dashboard Visitor needs to match Widget Agent.

## Implementation Strategy

1.  **Modify `MessagePane.tsx`:**
    - Extract `MessageBubble` component (internal or separate file) to handle the complex conditional styling and status logic.
    - Add opacity `0.7` for `status === 'sending'`.
    - Add a small spinner or "sending..." text for `status === 'sending'`.
    - Add red error icon/text for `status === 'failed'`.

2.  **Standardize CSS:**
    - Use `rounded-xl` instead of `rounded-lg` in Dashboard to match Widget's 12px/xl radius.
    - Ensure corner logic (`rounded-tr-none`) matches.

3.  **No API Changes Needed:** `inboxApi.ts` is already doing the heavy lifting. This is purely a UI presentation task.
