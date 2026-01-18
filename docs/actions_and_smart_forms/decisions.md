# Decision Log: Actions and Smart Forms

## Decision 1: Unified Event for Agent Messages
- **Date:** 2024-03-20
- **Context:** Agent-to-visitor communication was becoming fragmented, with text messages using `AGENT_REPLIED` and form requests using `FORM_REQUEST_SENT`.
- **Decision:** Use `AGENT_REPLIED` for ALL agent-initiated messages, including form requests and form submissions.
- **Rationale:** Simplifies the widget's message listener logic and ensures that `contentType` and `metadata` are consistently processed for all message types.
- **Alternatives Considered:** Keeping separate events for each type of message.
- **Consequences:** Requires the widget to accurately switch rendering logic based on `contentType`.

## Decision 2: WebSocket for Visitor Submissions
- **Date:** 2024-03-21
- **Context:** Visitors need to submit filled forms back to the system.
- **Decision:** Use a dedicated WebSocket event `SUBMIT_FORM` instead of an HTTP POST endpoint.
- **Rationale:** Leverages the existing persistent socket connection which already has the visitor's identity in the session data (`socket.data.visitorId`). This avoids the need for additional authentication tokens for public submissions.
- **Alternatives Considered:** Creating a public HTTP endpoint requiring a temporary JWT.
- **Consequences:** Limits form submission to active socket sessions.

## Decision 3: Metadata Snapshotting
- **Date:** 2024-03-22
- **Context:** Action templates can be edited or deleted by Managers.
- **Decision:** Include a snapshot of the template `definition` in the message metadata when a form is sent.
- **Rationale:** Ensures that a visitor can still fill and submit a form even if the original template is modified or deleted after the request was sent. It preserves the integrity of the specific interaction.
- **Alternatives Considered:** Referencing the template ID only and fetching definition on-the-fly.
- **Consequences:** Slightly increases message size but significantly improves reliability.

## Decision 4: "Filling" Indicator via existing Typing Store
- **Date:** 2024-03-23
- **Context:** Agents need real-time feedback when a visitor is interacting with a form.
- **Decision:** Reuse the existing `typingStore` mechanism on the frontend to track the "filling" status.
- **Rationale:** Avoids creating a redundant state management system for a very similar real-time indicator.
- **Alternatives Considered:** Creating a separate `formActivityStore`.
- **Consequences:** Requires adding a `fillingStatus` field to the existing typing store.
