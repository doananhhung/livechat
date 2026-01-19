# ROADMAP.md

> **Current Milestone**: Widget Forms Audit
> **Goal**: Ensure widget form handling works correctly for all edge cases

## Must-Haves

- [ ] Verify form rendering for all field types (text, number, date, boolean, select)
- [ ] Verify form validation (required fields, error display)
- [ ] Verify form submission flow (socket → backend → broadcast)
- [ ] Verify form state tracking (submitted, expired, disabled states)
- [ ] Verify error handling (network failures, session expired)

## Nice-to-Haves

- [ ] Test multi-tab form submission race conditions
- [ ] Test form resubmission prevention
- [ ] Document form flow in deep_investigation

## Phases

### Phase 1: Form Component Audit

**Status**: ✅ Complete
**Objective**: Review `FormRequestMessage.tsx` and `FormSubmissionMessage.tsx` for edge cases

**Scope:**

- Field type rendering (text, number, date, boolean, select)
- Validation logic and error display
- Expired/submitted state handling
- Theme (light/dark) support

**Files:**

- `packages/frontend/src/widget/components/FormRequestMessage.tsx`
- `packages/frontend/src/widget/components/FormSubmissionMessage.tsx`
- `packages/frontend/src/widget/components/__tests__/FormRequestMessage.test.tsx`
- `packages/frontend/src/widget/components/__tests__/FormSubmissionMessage.test.tsx`

---

### Phase 2: Form Submission Flow Audit

**Status**: ⬜ Not Started
**Objective**: Trace and verify the complete form submission flow

**Scope:**

- Widget → Socket (`emitSubmitForm`)
- Gateway handler (`handleSubmitForm`)
- `ActionsService.submitFormAsVisitor()`
- Broadcast to agents and visitor
- Store updates (`markFormAsSubmitted`)

**Files:**

- `packages/frontend/src/widget/services/socketService.ts` (L316-339)
- `packages/frontend/src/widget/App.tsx` (L162-170)
- `packages/frontend/src/widget/store/useChatStore.ts`
- `packages/backend/src/gateway/events.gateway.ts` (L393-436)
- `packages/backend/src/actions/actions.service.ts`

---

### Phase 3: Backend Actions Deep Dive

**Status**: ⬜ Not Started
**Objective**: Verify `ActionsService.submitFormAsVisitor()` implementation

**Scope:**

- Form request message lookup
- Submission record creation
- Form submission message creation
- Transaction integrity
- Error handling

**Files:**

- `packages/backend/src/actions/actions.service.ts`
- `packages/backend/src/actions/actions.module.ts`
- Related entity files

---

### Phase 4: Test Coverage & Verification

**Status**: ⬜ Not Started
**Objective**: Run existing tests and identify gaps

**Scope:**

- Run existing form component tests
- Identify missing test scenarios
- Manual E2E verification if needed

**Commands:**

```bash
# Run widget form tests
npm run test --workspace=@live-chat/frontend -- --run FormRequestMessage
npm run test --workspace=@live-chat/frontend -- --run FormSubmissionMessage
```

## Component Summary

| Component               | File                                        | Purpose                      |
| ----------------------- | ------------------------------------------- | ---------------------------- |
| `FormRequestMessage`    | widget/components/FormRequestMessage.tsx    | Interactive form UI          |
| `FormSubmissionMessage` | widget/components/FormSubmissionMessage.tsx | Read-only submission display |
| `emitSubmitForm`        | widget/services/socketService.ts            | Socket emit with callback    |
| `handleSubmitForm`      | gateway/events.gateway.ts                   | Gateway handler              |
| `ActionsService`        | actions/actions.service.ts                  | Business logic               |
