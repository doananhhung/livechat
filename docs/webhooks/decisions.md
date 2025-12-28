# Decision Log: Webhooks Engine

## Decision 1: Architecture Pattern - Asynchronous Dispatcher
- **Date:** 2025-12-10
- **Context:** We needed a way to send webhooks without impacting the latency of the core chat system.
- **Decision:** Use a "Dispatcher" pattern listening to Redis Pub/Sub, decoupling the event detection from the HTTP delivery via a persistent queue (BullMQ).
- **Rationale:** 
  - **Isolation:** If the webhook system crashes or slows down, chat remains fast.
  - **Reliability:** BullMQ provides built-in retries and persistence.
- **Alternatives Considered:** 
  - *Synchronous HTTP calls in the Controller:* Rejected. Too risky; a slow customer endpoint would block the API.
  - *Tailing the Database:* Rejected. Too much latency (polling).
- **Consequences:** We depend on Redis. If Redis Pub/Sub drops a message (fire-and-forget), the webhook is lost. We accepted this risk for V1.

## Decision 2: Security - HMAC-SHA256 Signatures
- **Date:** 2025-12-10
- **Context:** Customers need to verify that requests hitting their servers actually come from us.
- **Decision:** Sign every payload using HMAC-SHA256 with a unique per-subscription secret.
- **Rationale:** Industry standard (Stripe, GitHub). SHA-256 is currently secure.
- **Consequences:** Customers must implement signature verification code.

## Decision 3: SSRF Protection Strategy
- **Date:** 2025-12-10
- **Context:** Malicious users could enter internal IP addresses (e.g., `127.0.0.1`, `169.254.169.254`) as webhook URLs to scan our internal network.
- **Decision:** Implement strict DNS resolution and IP range checking at the application level (in `WebhooksService`).
- **Rationale:** 
  - Simple regex checks on the URL string are insufficient (DNS rebinding attacks, redirects).
  - We resolve the IP and check if it falls into private ranges (RFC 1918, etc.).
- **Consequences:** Slightly slower subscription creation due to DNS lookup.

## Decision 4: Event Mapping
- **Date:** 2025-12-10
- **Context:** Internal event names (`NEW_MESSAGE_CHANNEL`) might change.
- **Decision:** Map internal events to a stable public taxonomy (e.g., `message.created`).
- **Rationale:** Decouples internal refactors from the public API contract.
