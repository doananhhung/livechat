---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Widget State & Logic Tests

## Objective

Implement unit tests for `useChatStore` and `socketService` (specifically form methods) to close the test coverage gap on the frontend widget logic.

## Context

- .gsd/SPEC.md
- packages/frontend/src/widget/store/useChatStore.ts
- packages/frontend/src/widget/services/socketService.ts
- packages/frontend/vitest.setup.ts

## Tasks

<task type="auto">
  <name>Create Store Tests</name>
  <files>packages/frontend/src/widget/store/__tests__/useChatStore.test.ts</files>
  <action>
    Create a new test file for `useChatStore`.
    - Test `addMessage` adds messages correctly.
    - Test `setPendingForm` updates checking logic.
    - Test `markFormAsSubmitted` updates message metadata or state.
    - Ensure initial state is correct.
  </action>
  <verify>npm run test --workspace=@live-chat/frontend -- --run useChatStore</verify>
  <done>Store logic verified with passing tests</done>
</task>

<task type="auto">
  <name>Create Socket Service Tests</name>
  <files>packages/frontend/src/widget/services/__tests__/socketService.test.ts</files>
  <action>
    Create a new test file for `socketService` (create `__tests__` dir if needed).
    - Mock the socket instance.
    - Test `emitSubmitForm` calls socket.emit with expected payload.
    - Test handling of socket callbacks (success/error).
  </action>
  <verify>npm run test --workspace=@live-chat/frontend -- --run socketService</verify>
  <done>Socket emission logic verified</done>
</task>

## Success Criteria

- [ ] `useChatStore` has >80% coverage on form-related actions.
- [ ] `socketService` form emission is verified isolated from network.
- [ ] Existing component tests still pass.

---

phase: 4
plan: 2
wave: 2

---

# Plan 4.2: Full Verification & Golden Path

## Objective

Run all tests (frontend + backend) and perform a manual verification of the complete form flow to ensure specific "Must-Haves" are met.

## Context

- .gsd/SPEC.md
- packages/frontend/src/widget/App.tsx

## Tasks

<task type="auto">
  <name>Run All Unit Tests</name>
  <files>packages/frontend/package.json, packages/backend/package.json</files>
  <action>
    Execute the full test suite for both workspaces to ensure no regressions.
    - `npm run test --workspace=@live-chat/frontend`
    - `npm run test --workspace=@live-chat/backend`
  </action>
  <verify>See command output for all green</verify>
  <done>All unit tests pass</done>
</task>

<task type="checkpoint:human-verify">
  <name>Manual Golden Path Verification</name>
  <files>packages/frontend/src/widget/App.tsx</files>
  <action>
    Verify the "Golden Path" manually:
    1. Agent sends form request (use database seed or manual trigger if available, otherwise assume socket mock works).
    2. Visitor sees form (Rendering check).
    3. Visitor submits invalid data (Validation check).
    4. Visitor submits valid data (Submission check).
    5. Visitor sees "Form submitted" state.
    6. Agent sees submission (Database check).
  </action>
  <verify>Screenshot or confirmation of successful flow</verify>
  <done>Manual verification complete</done>
</task>

## Success Criteria

- [ ] All automated tests pass.
- [ ] Manual verification confirms E2E flow works in dev environment.
