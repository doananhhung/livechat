# Research Phase 4: Test Coverage & Verification

## Status

- **Date**: 2026-01-19
- **Scope**: Frontend Widget (Components, Store, Socket), Backend Actions (Service, Validator)

## Existing Coverage

### 1. Frontend Components (High Coverage)

- `FormRequestMessage.tsx`: Rendering, Validation, Loading, Expiry, Submitted states.
- `FormSubmissionMessage.tsx`: Read-only display, styling, formatting.

### 2. Backend Logic (High Coverage)

- `ActionsService`:
  - Template management (CRUD).
  - Submission creation (Validation, Integrity/Uniqueness).
  - Transaction handling (Success/Failure/Rollback).
- `ActionValidator`: Unit tested (inferred from file existence and robust service tests).

## Gaps Identified

### 1. Frontend State & Logic (Missing)

- **`useChatStore.ts`**: No tests found. Critical for managing `pendingFormRequest` and `messages` updates upon submission.
- **`socketService.ts`**: No tests found. Critical for ensuring `emitSubmitForm` maps data correctly and handles the callback.

### 2. Integration

- **Full Flow**: E2E verification is manual. No automated E2E for Widget -> Backend -> Widget loop.

## Plan Recommendations

1. **Store Tests**: Create `useChatStore.test.ts` to verify:
   - `addMessage` with FormRequest.
   - `markFormAsSubmitted` state update.
   - `setPendingForm` logic.
2. **Socket Service Tests**: Create `socketService.test.ts` (or add to existing if found, but none found) to verify:
   - `emitSubmitForm` calls socket with correct payload.
   - Handles callback success/error.
3. **Manual Verification**: Perform a full "Golden Path" manual verification as the final sign-off.

## Context Links

- [FormRequestMessage Tests](file:///home/hoang/node/live_chat/packages/frontend/src/widget/components/__tests__/FormRequestMessage.test.tsx)
- [Action Service Tests](file:///home/hoang/node/live_chat/packages/backend/src/actions/actions.service.spec.ts)
