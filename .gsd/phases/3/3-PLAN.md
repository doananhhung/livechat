---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Enforce Submission Integrity

## Objective

Enhance data integrity by adding a unique database constraint to `ActionSubmission` to prevent duplicate form submissions for the same request at the database level. Update `ActionsService` to gracefully handle potential race conditions caught by this constraint.

## Context

- .gsd/SPEC.md
- packages/backend/src/actions/entities/action-submission.entity.ts
- packages/backend/src/actions/features/actions.service.ts
- packages/backend/src/actions/utils/action-validator.ts

## Tasks

<task type="auto">
  <name>Add Unique Index to ActionSubmission</name>
  <files>packages/backend/src/actions/entities/action-submission.entity.ts</files>
  <action>
    Add a unique index to `formRequestMessageId` with a condition where it is not null.
    - Use `@Index(["formRequestMessageId"], { unique: true, where: "form_request_message_id IS NOT NULL" })`
    - This prevents multiple submissions for a single form request.
  </action>
  <verify>npm run build --workspace=@live-chat/backend</verify>
  <done>Entity file contains the new Index decorator</done>
</task>

<task type="auto">
  <name>Handle Unique Constraint Violation</name>
  <files>packages/backend/src/actions/actions.service.ts</files>
  <action>
    Wrap the `manager.save(submission)` call in a try/catch block.
    - Catch error code `23505` (Postgres unique violation).
    - Throw `ConflictException('This form has already been submitted')`.
    - Rethrow other errors.
  </action>
  <verify>npm run test --workspace=@live-chat/backend -- --run ActionsService</verify>
  <done>Service handles unique violations gracefully</done>
</task>

## Success Criteria

- [ ] Database schema enforces uniqueness for `formRequestMessageId`.
- [ ] ActionsService provides specific error for race-condition double submissions.
- [ ] Existing functionality remains stable.

---

phase: 3
plan: 2
wave: 1

---

# Plan 3.2: Transaction & Error Verification

## Objective

Verify the robustness of the `submitFormAsVisitor` transaction logic by adding targeted unit tests for edge cases like duplicate submissions (race conditions) and transaction rolling back.

## Context

- packages/backend/src/actions/actions.service.spec.ts

## Tasks

<task type="auto">
  <name>Add Duplicate Submission Test</name>
  <files>packages/backend/src/actions/actions.service.spec.ts</files>
  <action>
    Add a test case to `ActionsService` spec: `should throw ConflictException on database unique constraint violation`.
    - Mock `manager.save` to throw an error with code `23505`.
    - Verify that the service catches it and throws `ConflictException`.
  </action>
  <verify>npm run test --workspace=@live-chat/backend -- --run ActionsService</verify>
  <done>Test passes identifying correctly mapped exception</done>
</task>

## Success Criteria

- [ ] New test confirms that DB-level race conditions are handled as ConflictExceptions.
- [ ] All existing tests pass.
