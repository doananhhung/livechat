# Decision Log: Audit Logging System

## Decision 1: "Fail Open" Strategy for V1
- **Date:** 2025-12-12
- **Context:** If the audit log database fails (connection lost, disk full), should we block the user's action?
- **Decision:** **Fail Open**. The user's action proceeds even if logging fails.
- **Rationale:** 
    - For the initial version, system availability is higher priority than strict compliance tracking. 
    - Blocking user actions due to auxiliary logging failures creates a single point of failure.
- **Alternatives Considered:** 
    - *Fail Closed:* Throw 500 Error. Rejected because it degrades user experience during partial outages.
- **Consequences:** We might lose audit records during a database outage. This will need to be revisited for high-compliance environments (e.g., SOC2).

## Decision 2: Interceptor-Based Architecture
- **Date:** 2025-12-12
- **Context:** How to ensure consistent logging across hundreds of API endpoints without code duplication?
- **Decision:** Use a **NestJS Interceptor** + **Decorator**.
- **Rationale:** 
    - **AOP (Aspect Oriented Programming):** Keeps business logic clean.
    - **Consistency:** Ensures `actor`, `ip`, and `timestamp` are captured uniformly.
- **Consequences:** Developers must remember to add `@Auditable` to critical endpoints.

## Decision 3: Metadata Sanitization
- **Date:** 2025-12-12
- **Context:** Default logging of `request.body` risks leaking passwords (e.g., on `/login` or `/users` create).
- **Decision:** Implement a default blocklist sanitizer (`sanitizeMetadata`).
- **Rationale:** 
    - Developers will forget to manually exclude fields.
    - "Secure by Default" requires automatic redaction of obvious secrets.
- **Consequences:** Some useful debugging data might be accidentally redacted if it shares a name with a sensitive key (e.g., a token field that isn't secret).

## Decision 4: JSONB for Metadata
- **Date:** 2025-12-12
- **Context:** Different actions require different context (e.g., `User` update vs `Project` deletion).
- **Decision:** Use PostgreSQL `JSONB` column.
- **Rationale:** Allows schema flexibility without migrations for every new event type.

## Decision 5: Project Scoping (Tenancy)
- **Date:** 2025-12-12
- **Context:** Users need to see logs for *their* project, but the `audit_logs` table was originally global.
- **Decision:** Add a nullable `projectId` column to `audit_logs` and enforce filtering in `AuditController`.
- **Rationale:** 
    - Strictly enforcing tenant isolation is mandatory for security.
    - `projectId` allows efficient indexing and querying.
- **Consequences:** Older logs (from before this column) will have `projectId: null` and won't appear in the UI. Accepted for V1.

## Decision 6: Refactoring to Shared Types
- **Date:** 2025-12-12
- **Context:** The Frontend needed to know `AuditAction` enums to build the filter dropdown.
- **Decision:** Move `AuditAction` and `AuditLog` interfaces to the `shared-types` package.
- **Rationale:** DRY (Don't Repeat Yourself). Prevents frontend/backend enum drift.