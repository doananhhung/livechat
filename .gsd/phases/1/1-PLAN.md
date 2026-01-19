---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Form Component Audit

## Objective

Review existing form components and tests to identify edge cases and gaps. Run tests to verify current coverage.

## Context

- [FormRequestMessage.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/widget/components/FormRequestMessage.tsx)
- [FormSubmissionMessage.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/widget/components/FormSubmissionMessage.tsx)
- [FormRequestMessage.test.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/widget/components/__tests__/FormRequestMessage.test.tsx)
- [FormSubmissionMessage.test.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/widget/components/__tests__/FormSubmissionMessage.test.tsx)

## Existing Test Coverage

### FormRequestMessage.test.tsx (6 tests)

- ✅ Renders form fields from definition
- ✅ Submit button enabled (validation on submit)
- ✅ Shows validation errors when required fields empty
- ✅ Shows loading state during submission
- ✅ Shows expired state
- ✅ Shows submitted state

### FormSubmissionMessage.test.tsx (3 tests)

- ✅ Renders submitted data read-only
- ✅ Displays boolean values as Yes/No
- ✅ Applies visitor styling

## Identified Gaps

### FormRequestMessage

1. **Date field type** — No test for `type="date"` input rendering
2. **Boolean field type** — No test for checkbox rendering and toggling
3. **Select field type** — No test for dropdown and option selection
4. **Dark theme** — Only tests light theme
5. **Number field NaN** — No test for clearing number field (produces NaN)
6. **Error clearing** — No test verifying errors clear when user types

### FormSubmissionMessage

1. **Agent styling** — Only tests visitor styling
2. **Dark theme** — Only tests light theme
3. **Empty/null values** — No test for `null` or `undefined` data values (displays "-")

---

## Tasks

<task type="auto">
  <name>Run existing form tests</name>
  <files>packages/frontend/src/widget/components/__tests__/</files>
  <action>
    Run all form-related tests to verify current state passes.
  </action>
  <verify>
    npm run test --workspace=@live-chat/frontend -- --run FormRequestMessage FormSubmissionMessage
  </verify>
  <done>All existing tests pass</done>
</task>

<task type="auto">
  <name>Add missing field type tests</name>
  <files>packages/frontend/src/widget/components/__tests__/FormRequestMessage.test.tsx</files>
  <action>
    Add tests for:
    1. Date field renders date picker and handles input
    2. Boolean field renders checkbox and toggles correctly
    3. Select field renders dropdown with options and handles selection
    4. Number field handles NaN when cleared (should store NaN or empty)
  </action>
  <verify>
    npm run test --workspace=@live-chat/frontend -- --run FormRequestMessage
  </verify>
  <done>All new tests pass, coverage for all 5 field types</done>
</task>

<task type="auto">
  <name>Add theme and edge case tests</name>
  <files>
    packages/frontend/src/widget/components/__tests__/FormRequestMessage.test.tsx
    packages/frontend/src/widget/components/__tests__/FormSubmissionMessage.test.tsx
  </files>
  <action>
    Add tests for:
    1. FormRequestMessage dark theme styling
    2. FormSubmissionMessage dark theme styling
    3. FormSubmissionMessage null/undefined data values display "-"
    4. Error clearing when user types in a field
  </action>
  <verify>
    npm run test --workspace=@live-chat/frontend -- --run FormRequestMessage FormSubmissionMessage
  </verify>
  <done>All edge case tests pass</done>
</task>

---

## Success Criteria

- [ ] All existing tests pass
- [ ] Tests added for all 5 field types (text, number, date, boolean, select)
- [ ] Tests added for dark theme rendering
- [ ] Tests added for edge cases (NaN, null values, error clearing)

## Verification Commands

```bash
# Run all form tests
npm run test --workspace=@live-chat/frontend -- --run FormRequestMessage FormSubmissionMessage

# Run with coverage (optional)
npm run test --workspace=@live-chat/frontend -- --run FormRequestMessage FormSubmissionMessage --coverage
```
