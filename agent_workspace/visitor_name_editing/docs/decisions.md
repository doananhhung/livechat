# Decision Log: Visitor Name Editing

## Decision 1: Use `PATCH` for Updates
- **Date:** 2025-12-14
- **Context:** We need to update a single field (`displayName`) of a visitor resource.
- **Decision:** Use HTTP `PATCH` method.
- **Rationale:**
  1.  **Semantics:** `PATCH` is the correct verb for partial updates.
  2.  **Efficiency:** Only sends the changed data, not the entire resource.

## Decision 2: Real-time via WebSocket Events
- **Date:** 2025-12-14
- **Context:** When one agent renames a visitor, others viewing the same conversation list need to see the change immediately to avoid confusion.
- **Decision:** Broadcast a `visitorUpdated` event via WebSocket.
- **Rationale:**
  1.  **UX:** Eliminates the need for manual refresh.
  2.  **Consistency:** Ensures all agents see the same "truth".
  3.  **Existing Infrastructure:** Leveraging the existing `EventsGateway` and socket connection.

## Decision 3: Inline vs Modal Editing
- **Date:** 2025-12-14
- **Context:** Agents need to rename visitors from different contexts (Details Panel vs Conversation List).
- **Decision:** Implement both Inline (Details) and Modal (List) experiences.
- **Rationale:**
  1.  **Workflow Efficiency:** Inline is faster when already viewing details. Modal is better when managing a list of queues.
  2.  **Familiarity:** Inline editing matches patterns in tools like Slack/Discord.

## Decision 4: Audit Logging
- **Date:** 2025-12-14
- **Context:** Renaming a visitor changes the context of a conversation. We need accountability.
- **Decision:** Log all name changes to the Audit Log.
- **Rationale:**
  1.  **Security:** Traceability of who changed the name and when.
  2.  **Debugging:** Helps resolve disputes about visitor identity.
