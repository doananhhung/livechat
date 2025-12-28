# Implementation Log: Webhooks Engine

## Status
- [x] Implementation Complete
- [x] Tests Passing (E2E)
- [x] Review Changes Applied

## Changes
1.  **Module Configuration:**
    -   Registered `WebhooksController` in `WebhooksModule`.
    -   Added `WebhookSubscription` and `WebhookDelivery` to global `DATABASE_ENTITIES` in `database.config.ts`.

2.  **Entities:**
    -   Updated `WebhookDelivery.eventId` to `varchar` to support non-UUID message IDs (e.g. BigInt).

3.  **Processor:**
    -   Added null-check for `error.response.status` to prevent runtime errors when Axios error has no response (e.g. timeout).
    -   Ensured `responseStatus` is saved as `0` or null if undefined.

4.  **Tests:**
    -   Created `packages/backend/test/webhooks.e2e-spec.ts`.
    -   Covered Happy Path (Create, Dispatch, Deliver).
    -   Covered Edge Cases (Inactive subscription, SSRF protection).
    -   Covered Error Handling (Target 500, Timeout).

5.  **Review Fixes:**
    -   Enhanced SSRF protection in `WebhooksService` to use `dns.lookup` for full resolution and check against private ranges.
    -   Added missing "Target Timeout" and "Redis Error" coverage (via timeout simulation) in E2E tests.

## Verification
-   Run `npm run test:e2e packages/backend/test/webhooks.e2e-spec.ts` to verify.