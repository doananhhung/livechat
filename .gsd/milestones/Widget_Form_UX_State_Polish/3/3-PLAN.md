---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified: []
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Automated tests pass for Widget Store and Components"
    - "Manual verification confirms form persistence across reloads"
    - "Manual verification confirms receipt UI appears after submission"
  artifacts:
    - ".gsd/phases/3/walkthrough.md"
---

# Plan 3.1: Final Verification

## Objective

Execute a comprehensive verification of the "Widget Form UX & State Polish" milestone. This includes running automated regression tests and generating a manual walkthrough guide for the user to validate the end-to-end experience.

## Context

- .gsd/SPEC.md
- .gsd/ROADMAP.md
- packages/frontend/src/widget/store/**tests**/useChatStore.test.ts
- packages/frontend/src/widget/components/**tests**/FormSubmissionMessage.test.ts

## Tasks

<task type="auto">
  <name>Run Automated Widget Tests</name>
  <files>packages/frontend/src/widget/**/*</files>
  <action>
    Run the full suite of widget-specific tests to ensure no regressions in state logic or UI components.
    Target specifically `useChatStore` (persistence logic) and `FormSubmissionMessage` (UI logic).
  </action>
  <verify>npm run test:widget</verify>
  <done>All widget tests pass (especially persistence and UI component tests)</done>
</task>

<task type="auto">
  <name>Create Verification Walkthrough</name>
  <files>.gsd/phases/3/walkthrough.md</files>
  <action>
    Create a detailed `walkthrough.md` file that guides the user through Manual Verification.
    Include steps for:
    1. **Persistence Check**: Submit form -> Reload page -> Verify form remains "Submitted".
    2. **UI Check**: Submit form -> Verify "Receipt" card appears with correct data -> Verify styling (Visitor color vs Agent).
    3. **Edge Case**: Verify behavior when quick-reloading immediately after submit.
  </action>
  <verify>test -f .gsd/phases/3/walkthrough.md</verify>
  <done>Walkthrough file exists with clear steps for Phase 1 and Phase 2 features</done>
</task>

## Verification

After all tasks, verify:

- [ ] Automated tests are GREEN
- [ ] Walkthrough guide is generated and accurate

## Success Criteria

- [ ] All widget tests passed
- [ ] Validation guide provided to user
