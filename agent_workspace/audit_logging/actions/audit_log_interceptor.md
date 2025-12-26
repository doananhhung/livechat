# Action Log: Audit Log Interceptor

## Status: Fixes Applied

### Changes Implemented
1.  **Sanitizer Utility (`audit.utils.ts`):** Created `sanitizeMetadata` function and `DEFAULT_SENSITIVE_KEYS` set to redact sensitive information (e.g., passwords, tokens) from metadata.
2.  **Request Type Interface (`request-with-user.interface.ts`):** Created `RequestWithUser` and `AuthenticatedUser` interfaces in `packages/backend/src/common/interfaces/` for stricter typing of the request object.
3.  **Interceptor (`audit.interceptor.ts`):**
    *   Updated imports to include `sanitizeMetadata`, `DEFAULT_SENSITIVE_KEYS`, and `RequestWithUser`.
    *   Replaced `(request as any).user` with `request.user` after updating the request type to `RequestWithUser`.
    *   Applied `sanitizeMetadata` to `requestBody` and `responseBody` in the default metadata logging (success path).
    *   Applied `sanitizeMetadata` to `requestBody` in the error path metadata logging.
4.  **Tests (`audit.interceptor.spec.ts`):**
    *   Updated `mockExecutionContext` and `mockRequest` types to use `RequestWithUser` and `AuthenticatedUser`.
    *   Added new test cases to verify that default metadata logging sanitizes sensitive data in both success and error scenarios.

### Files Created/Modified
- **Created:**
    - `packages/backend/src/audit/audit.utils.ts`
    - `packages/backend/src/common/interfaces/request-with-user.interface.ts`
- **Modified:**
    - `packages/backend/src/audit/audit.interceptor.ts`
    - `packages/backend/src/audit/audit.interceptor.spec.ts`

### Dependencies
- `AuditService` (from `audit_log_core`)
- `@nestjs/common`, `@nestjs/core`, `rxjs`
- `express` (for `Request` type)

Ready for re-review.