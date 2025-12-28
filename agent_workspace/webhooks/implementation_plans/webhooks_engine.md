# Implementation Plan: webhooks_engine

## 1. Acceptance Tests (What "Done" Looks Like)
Before writing code, define the tests that MUST pass:

### Happy Path Tests
- [ ] Test: `POST /webhooks/subscriptions` creates a valid subscription with a generated secret. → Expected: 201 Created, returns secret.
- [ ] Test: Dispatcher receives `NEW_MESSAGE_FROM_VISITOR` event. → Expected: Enqueues job in `webhooks-queue`.
- [ ] Test: Sender processes job. → Expected: Sends POST to target URL with correct `X-Hub-Signature-256` and payload.
- [ ] Test: Delivery success. → Expected: `webhook_deliveries` record created with status `SUCCESS`.

### Edge Case Tests
- [ ] Test: Subscription has `isActive: false`. → Expected: Dispatcher ignores the event.
- [ ] Test: Target URL is an internal IP (SSRF attempt). → Expected: Creation rejected OR delivery blocked (depending on validation strategy, design implies validation at usage/creation). *Constraint: Block at creation and delivery.*
- [ ] Test: No subscriptions for event. → Expected: No jobs enqueued.

### Error Handling Tests
- [ ] Test: Target returns 500. → Expected: Job fails, retry count increments (BullMQ behavior), delivery logged as `PENDING`/`FAILURE`.
- [ ] Test: Target times out (>5s). → Expected: Job fails with timeout error.
- [ ] Test: Redis is down. → Expected: Error logged, system does not crash (defensive try/catch in Dispatcher).

## 2. Implementation Approach
I will implement this as a distinct `WebhooksModule` in the NestJS backend.
1.  **Entities:** Define TypeORM entities for `WebhookSubscription` and `WebhookDelivery`.
2.  **Service:** `WebhooksService` for CRUD operations on subscriptions (including secret generation).
3.  **Dispatcher:** A service listening to Redis Pub/Sub (likely reusing an existing RedisModule or creating a dedicated listener). It filters events and adds to BullMQ.
4.  **Processor:** A BullMQ `Worker` ("Sender") that picks up jobs, signs the payload using HMAC-SHA256, and executes the HTTP request with strict timeouts.
5.  **Validation:** Custom validator for URLs to prevent SSRF (block private ranges).

## 3. Files to Create/Modify
- `packages/backend/src/webhooks/webhooks.module.ts` — Module definition.
- `packages/backend/src/webhooks/entities/webhook-subscription.entity.ts` — DB Schema.
- `packages/backend/src/webhooks/entities/webhook-delivery.entity.ts` — Audit Log Schema.
- `packages/backend/src/webhooks/webhooks.service.ts` — CRUD & Secret logic.
- `packages/backend/src/webhooks/webhook.dispatcher.ts` — Redis Listener -> Queue Producer.
- `packages/backend/src/webhooks/webhook.processor.ts` — Queue Consumer (Sender).
- `packages/backend/src/webhooks/dto/create-subscription.dto.ts` — Input validation.
- `packages/backend/test/webhooks.e2e-spec.ts` — End-to-end verification.

## 4. Dependencies
- `@nestjs/bullmq`, `bullmq` (Queue)
- `@nestjs/typeorm`, `typeorm` (Database)
- `axios` (HTTP Client - preferred for explicit timeout config)
- `crypto` (Native Node module for HMAC)

## 5. Risk Assessment
- **SSRF:** High risk. Must ensure the IP validator covers IPv4 and IPv6 private ranges effectively.
- **Queue Backpressure:** If a customer endpoint is down, retries could fill the queue. BullMQ's exponential backoff mitigates this, but monitoring will be needed eventually.
- **Event Mapping:** Need to ensure `CONVERSATION_CREATED` exists in the upstream event sources.
