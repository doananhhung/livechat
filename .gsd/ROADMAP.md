# ROADMAP.md

> **Current Milestone**: Widget Form UX & State Polish
> **Goal**: Ensure form state persists correctly across reloads and provide informative submitted views.

## Must-Haves

- [ ] Fix form re-rendering issue on widget reload (persistence/hydration)
- [ ] UI: Display submitted data in "Form submitted" state (read-only view)
- [ ] UI: Ensure submitted view matches form layout/design

## Phases

### Phase 1: Form Persistence Fix

**Status**: ⬜ Not Started
**Objective**: Debug and fix form state loss/corruption on widget reload. Ensure `submittedFormMessageIds` and message state are correctly rehydrated from local storage or socket history.

### Phase 2: Enhanced Submission UI

**Status**: ⬜ Not Started
**Objective**: Upgrade `FormSubmissionMessage.tsx` to render the actual submitted data instead of a generic success message.

### Phase 3: Verification

**Status**: ⬜ Not Started
**Objective**: Manual and automated verification of reload persistence and UI correctness.
