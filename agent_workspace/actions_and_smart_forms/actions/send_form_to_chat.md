# Implementation Log: send_form_to_chat

## Build Date: 2025-12-27

## FINAL_VERIFY Completed
- Re-read implementation plan: Yes
- All acceptance tests implemented: Yes

## Summary

Implemented the "Send Form to Chat" feature allowing agents to send forms to visitors who can fill and submit them.

## Acceptance Tests Implemented

### Backend Unit Tests (16/16)
| Test | File |
|------|------|
| sendFormRequest() valid templateId | actions.service.spec.ts |
| sendFormRequest() disabled template | actions.service.spec.ts |
| sendFormRequest() pending form conflict | actions.service.spec.ts |
| submitFormAsVisitor() valid data | actions.service.spec.ts |
| submitFormAsVisitor() invalid data | actions.service.spec.ts |
| submitFormAsVisitor() no pending request | actions.service.spec.ts |
| submitFormAsVisitor() expired request | actions.service.spec.ts |
| updateSubmission() by owner | actions.service.spec.ts |
| updateSubmission() by non-owner | actions.service.spec.ts |
| deleteSubmission() by agent | actions.service.spec.ts |
| + 6 existing tests | actions.service.spec.ts |

### Backend Gateway Tests (17/17)
| Test | File |
|------|------|
| handleVisitorFillingForm broadcast | events.gateway.spec.ts |
| emitFormRequestSent to visitor | events.gateway.spec.ts |
| emitFormSubmitted to project + visitor | events.gateway.spec.ts |
| emitFormSubmitted to project only | events.gateway.spec.ts |
| emitFormUpdated | events.gateway.spec.ts |
| emitFormDeleted | events.gateway.spec.ts |
| + 11 existing tests | events.gateway.spec.ts |

### E2E Tests (5)
| Test | File |
|------|------|
| POST form-request valid | actions.e2e-spec.ts |
| POST form-request no auth | actions.e2e-spec.ts |
| POST form-request disabled template | actions.e2e-spec.ts |
| PUT submissions valid update | actions.e2e-spec.ts |
| DELETE submissions | actions.e2e-spec.ts |

### Frontend Tests (9)
| Test | File |
|------|------|
| FormRequestMessage renders fields | FormRequestMessage.test.tsx |
| FormRequestMessage validation errors | FormRequestMessage.test.tsx |
| FormRequestMessage loading state | FormRequestMessage.test.tsx |
| FormRequestMessage expired state | FormRequestMessage.test.tsx |
| FormRequestMessage submitted state | FormRequestMessage.test.tsx |
| + 1 button test | FormRequestMessage.test.tsx |
| FormSubmissionMessage renders data | FormSubmissionMessage.test.tsx |
| FormSubmissionMessage boolean values | FormSubmissionMessage.test.tsx |
| FormSubmissionMessage visitor styling | FormSubmissionMessage.test.tsx |

## Files Modified

### Shared Types
- `packages/shared-types/src/message.types.ts` — Added MessageContentType enum
- `packages/shared-types/src/actions.ts` — Added FormRequestMetadata, FormSubmissionMetadata
- `packages/shared-types/src/websocket.types.ts` — Added form events and payloads

### Backend
- `packages/backend/src/actions/entities/action-submission.entity.ts` — Added visitorId, formRequestMessageId
- `packages/backend/src/database/entities/message.entity.ts` — Added contentType, metadata
- `packages/backend/src/actions/actions.service.ts` — Added 5 new methods
- `packages/backend/src/actions/actions.controller.ts` — Added 3 endpoints
- `packages/backend/src/gateway/events.gateway.ts` — Added form event handlers
- `packages/backend/src/actions/actions.service.spec.ts` — Added 10 tests
- `packages/backend/src/gateway/events.gateway.spec.ts` — Added 6 tests
- `packages/backend/test/actions.e2e-spec.ts` — Added 5 E2E tests
- 2 database migrations

### Frontend (Widget)
- `packages/frontend/src/widget/components/FormRequestMessage.tsx` — NEW
- `packages/frontend/src/widget/components/FormSubmissionMessage.tsx` — NEW
- `packages/frontend/src/widget/components/Message.tsx` — Added form content type handling
- `packages/frontend/src/widget/components/__tests__/FormRequestMessage.test.tsx` — NEW (6 tests)
- `packages/frontend/src/widget/components/__tests__/FormSubmissionMessage.test.tsx` — NEW (3 tests)

### Frontend (Agent Dashboard)
- `packages/frontend/src/components/features/actions/SendFormModal.tsx` — NEW
- `packages/frontend/src/services/actionApi.ts` — Added sendFormRequest, updateSubmission, deleteSubmission

### Shared DTOs
- `packages/shared-dtos/src/send-form-request.dto.ts` — NEW
- `packages/shared-dtos/src/submit-form-as-visitor.dto.ts` — NEW
- `packages/shared-dtos/src/update-submission.dto.ts` — NEW

## Verification Results
- Type check: ✓ Passed
- Build: ✓ Succeeded
- Backend Unit tests: 16/16 passed
- Backend Gateway tests: 17/17 passed
- Backend E2E tests: 11/11 passed

### Widget Tests — Infrastructure Blocker
Widget component tests written but cannot run. The project uses:
- **React Testing Library** for React components (dashboard)
- **Preact** for widget components

The Vitest config is set up for React (`jsdom` environment). Running Preact tests requires aliasing `react → preact/compat`, which could break existing React tests. This is an infrastructure issue, not a code issue.

**Installed:** `@testing-library/preact`
**Written:** 9 tests in `src/widget/components/__tests__/`
**Status:** Blocked pending Vitest config split for widget vs dashboard tests

## Error Taxonomy
Error states from design covered:
- Disabled template → BadRequestException
- Pending form conflict → ConflictException
- Expired form → GoneException
- Invalid data → BadRequestException
- Permission denied → ForbiddenException

---
Ready for review.

---

## Deviation Fixes

### Fix: Agent UI Trigger Missing

**Deviation:** `SendFormModal` component existed but was not integrated into `ActionPanel`.

**Fix Applied:**
- Added import for `SendFormModal` to `ActionPanel.tsx`
- Added `isSendFormModalOpen` state
- Added "Send Form" button with `Send` icon in header
- Rendered `SendFormModal` with `isOpen`, `onClose`, `projectId`, `conversationId`, `onFormSent` props

**Verification:**
- Type check: ✓ Passed
- Integration: ✓ Modal opens from ActionPanel button

---

### Fix: WebSocket Event Not Emitted

**Deviation:** `sendFormRequest` saved message to DB but did not emit WebSocket events. Form messages invisible to agents and visitors.

**Root Cause:** `ActionsService` did not inject `EventEmitter2`. Gateway emit methods existed but were never called.

**Fix Applied:**
1. Injected `EventEmitter2` into `ActionsService`
2. After `messageRepository.save()`, emit `form.request.sent` event with:
   - `message`, `conversationId`, `projectId`, `visitorUid`
3. Added `@OnEvent('form.request.sent')` handler in `gateway.event-listener.ts`:
   - Broadcasts `NEW_MESSAGE` to project room (agents see it)
   - Emits `formRequestSent` to visitor socket (visitor receives form)

**Files Modified:**
- `packages/backend/src/actions/actions.service.ts` — Added EventEmitter2, emit after save
- `packages/backend/src/gateway/gateway.event-listener.ts` — Added form.request.sent handler
- `packages/backend/src/actions/actions.service.spec.ts` — Added EventEmitter2 mock

**Verification:**
- Type check: ✓ Passed
- Unit tests: 16/16 passed


