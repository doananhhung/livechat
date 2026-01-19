# Webhooks Engine

## Purpose
The Webhooks Engine empowers customers to build integrations by providing real-time HTTP notifications for system events. Instead of polling the API, customers can subscribe to events like `message.created` and receive immediate updates, enabling workflows such as syncing data to CRM, triggering automated replies, or updating external dashboards.

## Summary
The engine is an asynchronous event distribution system. It listens to internal system events (broadcasted via Redis Pub/Sub), filters them based on customer subscriptions, and reliably delivers them via HTTP POST requests to configured target URLs.

## Key Components
- **Webhook Dispatcher**: Listens to internal Redis channels, filters events against active subscriptions, and enqueues delivery jobs.
- **Webhook Processor (Sender)**: Consumes delivery jobs, signs the payload for security, and executes the HTTP POST request with retry logic.
- **Subscription Management**: An API for customers to configure where (URL) and what (Events) they want to hear about.
- **Audit Logging**: A complete history of delivery attempts (`WebhookDelivery`) for debugging and visibility.

## How It Works
1.  **Subscription**: A user creates a webhook subscription via the API, specifying a target URL and events (e.g., `message.created`).
2.  **Event Detection**: When an event occurs (e.g., a visitor sends a message), the system publishes it to Redis.
3.  **Dispatch**: The `WebhookDispatcher` picks up the event, finds all matching subscriptions for the project, and creates a background job for each.
4.  **Delivery**: The `WebhookProcessor` picks up the job, signs the payload using HMAC-SHA256 with the subscription's secret, and sends a POST request to the user's URL.
5.  **Retry**: If the user's server fails (500) or times out, the system automatically retries with exponential backoff.

## Related Documentation
- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)
