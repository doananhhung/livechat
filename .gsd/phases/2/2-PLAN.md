---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Verify Validator & Existing Flow

## Objective

Establish a solid baseline for the form submission flow by verifying the data validation logic (currently untested) and confirming existing service/gateway tests pass.

## Context

- [actions.service.ts](file:///home/hoang/node/live_chat/packages/backend/src/actions/actions.service.ts)
- [action-validator.ts](file:///home/hoang/node/live_chat/packages/backend/src/actions/utils/action-validator.ts)
- [actions.service.spec.ts](file:///home/hoang/node/live_chat/packages/backend/src/actions/actions.service.spec.ts)
- [events.gateway.spec.ts](file:///home/hoang/node/live_chat/packages/backend/src/gateway/events.gateway.spec.ts)

## Tasks

<task type="auto">
  <name>Create Validator Tests</name>
  <files>packages/backend/src/actions/utils/action-validator.spec.ts</files>
  <action>
    Create a new test file `action-validator.spec.ts` to rigorously test `validateActionData`.
    Coverage requirements:
    - strict mode (extra fields)
    - type constraints (text, number, boolean, date, select)
    - required vs optional fields
    - edge cases: NaN, invalid date strings, null/undefined
  </action>
  <verify>
    npm run test --workspace=@live-chat/backend -- --run action-validator.spec.ts
  </verify>
  <done>New validator tests pass covering all field types and strictly mode</done>
</task>

<task type="auto">
  <name>Run Backend Flow Tests</name>
  <files>
    packages/backend/src/actions/actions.service.spec.ts
    packages/backend/src/gateway/events.gateway.spec.ts
  </files>
  <action>
    Run the existing service and gateway tests to verify the current "Happy Path" and mocked error handling.
    This establishes the baseline before we probe for deeper issues (atomicity) in the next plan.
  </action>
  <verify>
    npm run test --workspace=@live-chat/backend -- --run actions.service.spec.ts events.gateway.spec.ts
  </verify>
  <done>All existing backend flow tests pass</done>
</task>

## Success Criteria

- [ ] `validateActionData` is fully tested and verified (currently 0 tests)
- [ ] Existing backend tests pass (establishing baseline functionality)
