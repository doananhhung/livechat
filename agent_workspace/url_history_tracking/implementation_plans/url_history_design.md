# Implementation Plan: Session-Based URL History & Referrer Tracking

## 1. Acceptance Tests (What "Done" Looks Like)

### Backend

#### Unit Tests (Services/Business Logic)
- [ ] Test: `ConversationPersistenceService.findOrCreateByVisitorId` with `metadata` → Expected: Persists metadata to the conversation record.
- [ ] Test: `EventConsumerService.handleNewMessageFromVisitor` passes `metadata` correctly from payload to `ConversationPersistenceService`.

#### E2E Tests (API Endpoints/Workers)
- [ ] Test: `sendMessage` event (first message) with `sessionMetadata` → Expected: `metadata` column in `Conversation` table contains history and referrer.
- [ ] Test: `updateContext` event with `url` → Expected: Appends URL to `metadata.urlHistory` in DB if conversation is open.
- [ ] Test: `updateContext` event respects the 50-entry limit (FIFO) when appending.

### Frontend (Widget)

#### Unit Tests (Services)
- [ ] Test: `HistoryTracker.init()` with `document.referrer` → Expected: Saves referrer to storage only on first load (session scope).
- [ ] Test: `HistoryTracker.push(url)` → Expected: Adds URL to history, trims to 50 entries.
- [ ] Test: `HistoryTracker.push(url)` with sensitive params → Expected: Stores sanitized URL (removes sensitive keys).
- [ ] Test: `HistoryTracker.getMetadata()` → Expected: Returns full `VisitorSessionMetadata` object.

#### E2E Tests (Critical User Flows)
- [ ] Test: Visitor lands on Page A (Referrer Google) -> Navigates to Page B -> Sends Message → Expected: Backend receives metadata with referrer "Google" and history [Page A, Page B].
- [ ] Test: Visitor navigates after conversation start → Expected: New URLs are appended to conversation metadata on backend.

### Frontend (Agent Dashboard)

#### Unit Tests (Components)
- [ ] Test: `VisitorDetailsPanel` renders "Session History" section.
- [ ] Test: History list shows max 5 items by default.
- [ ] Test: "Show All" button expands the list to show all items.
- [ ] Test: Real-time update: Receiving `conversationUpdated` adds new URL to the top of the list.

## 2. Implementation Approach
1.  **Shared Types**: Define the `VisitorSessionMetadata` and related interfaces in `shared-types`.
2.  **Backend**: 
    -   Add `metadata` jsonb column to `Conversation` entity.
    -   Update `SendMessagePayload` to include optional `sessionMetadata`.
    -   Update `EventConsumerService` to handle `sessionMetadata` in `NEW_MESSAGE_FROM_VISITOR` event.
    -   Update `ConversationPersistenceService` to save/update metadata.
    -   Modify `EventsGateway` to handle `updateContext` by appending to DB metadata (direct write or via service).
3.  **Frontend (Widget)**: 
    -   Create `HistoryTracker` service to manage `sessionStorage` state.
    -   Initialize `HistoryTracker` in `App.tsx` (or `main.tsx`) to capture referrer immediately.
    -   Hook into `handleUrlChange` in `App.tsx` to push new URLs.
    -   Update `handleSendMessage` in `App.tsx` to attach metadata on first message.
    -   *Refinement*: `socketService.emitSendMessage` will take an optional metadata arg.
4.  **Frontend (Agent Dashboard)**:
    -   Update `VisitorDetailsPanel` (or equivalent sidebar component) to consume `conversation.metadata`.
    -   Implement the truncated list view with "Show All" toggle.
    -   Ensure `useConversationStore` or socket listeners handle `conversationUpdated` events to refresh the metadata.

## 3. Files to Create/Modify
-   `packages/shared-types/src/conversation.types.ts` — Add `VisitorSessionMetadata` interfaces.
-   `packages/shared-types/src/websocket.types.ts` — Update `SendMessagePayload`.
-   `packages/backend/src/database/entities/conversation.entity.ts` — Add `metadata` column.
-   `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts` — Update methods to save metadata.
-   `packages/backend/src/inbox/inbox-event.handler.ts` — Pass metadata to worker payload.
-   `packages/backend/src/event-consumer/event-consumer.service.ts` — Use metadata in transaction.
-   `packages/backend/src/gateway/events.gateway.ts` — Update `handleUpdateContext` to append history.
-   `packages/frontend/src/widget/services/historyTracker.ts` — **Create**. Logic for storage and sanitization.
-   `packages/frontend/src/widget/services/socketService.ts` — Update `emitSendMessage`.
-   `packages/frontend/src/widget/App.tsx` — Integrate `HistoryTracker`.
-   `packages/frontend/src/components/VisitorDetailsPanel.tsx` (or similar) — **Modify**. Add History UI.

## 4. Dependencies
-   `date-fns` (Optional, or just use native `Date`) for timestamps.
-   No new external libraries.

## 5. Risk Assessment
-   **Payload Size**: If 50 URLs are long, WebSocket payload might be large. *Mitigation*: The 50 limit is small enough.
-   **Race Conditions**: `updateContext` vs `sendMessage`. *Mitigation*: Backend appends. If `sendMessage` arrives first, it sets initial. If `updateContext` arrives first, it might fail if conversation doesn't exist (it should only be sent if session ready).
-   **Storage**: `sessionStorage` might be disabled in some browsers (rare). *Mitigation*: Wrap in try/catch, fail silently.