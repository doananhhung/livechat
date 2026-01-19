# Research Phase 3: Backend Actions Deep Dive

## Status

- **Date**: 2026-01-19
- **Scope**: `ActionsService`, `ActionSubmission` entity, Transaction Integrity

## Findings

### 1. Existing Implementation (`ActionsService`)

- `submitFormAsVisitor` is fully implemented with `dataSource.transaction`.
- **Invariants Enforced**:
  - Conversation exists.
  - Form request exists and is valid.
  - Form not already submitted (Application-level check).
  - Template exists.
  - Data valid against definition.
- **Transaction Scope**: Covers submission creation and message creation. Atomicity is handled.

### 2. Database Integrity Gaps

- **Missing Unique Constraint**: `ActionSubmission` checks for `existingSubmission` via application logic:
  ```typescript
  const existingSubmission = await this.submissionsRepository.findOne({
    where: { formRequestMessageId: dto.formRequestMessageId },
  });
  ```

  - This is susceptible to race conditions in `READ COMMITTED` isolation (default).
  - **Recommendation**: Add a partial unique index on `form_request_message_id` where it is not null.

### 3. Performance

- **Missing Index**: `form_request_message_id` is used for lookups but lacks an explicit `@Index`.
- **Recommendation**: The unique index will serve both integrity and performance.

### 4. Test Coverage

- Unit tests for `ActionsService` need to verify:
  - Transaction rollback on message creation failure.
  - Race condition handling (simulated or via DB constraint).
  - Validation failures.

## Plan Recommendations

1. **Enhance Integrity**: Add `@Index(["formRequestMessageId"], { unique: true, where: "form_request_message_id IS NOT NULL" })` to `ActionSubmission`.
2. **Refine Service**: Ensure proper error mapping for duplicate key exceptions (if using DB constraint).
3. **Deep Verification**: Write focused unit tests for `submitFormAsVisitor` mocking `DataSource` and `EntityManager`.

## Context Links

- [ActionsService](file:///home/hoang/node/live_chat/packages/backend/src/actions/actions.service.ts)
- [ActionSubmission](file:///home/hoang/node/live_chat/packages/backend/src/actions/entities/action-submission.entity.ts)
