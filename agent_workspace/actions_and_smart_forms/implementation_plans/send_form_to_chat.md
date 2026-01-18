# Implementation Plan: send_form_to_chat

## 1. Acceptance Tests (What "Done" Looks Like)

### Backend

#### Unit Tests (Services/Business Logic)

- [ ] Test: `ActionsService.sendFormRequest()` with valid templateId → Expected: Creates message with `contentType=form_request`, returns message
- [ ] Test: `ActionsService.sendFormRequest()` with disabled template → Expected: throws `BadRequestException`
- [ ] Test: `ActionsService.sendFormRequest()` with pending form in conversation → Expected: throws `ConflictException` (HTTP 409)
- [ ] Test: `ActionsService.submitFormAsVisitor()` with valid data → Expected: Creates `ActionSubmission` with `visitorId`, `formRequestMessageId`; creates `form_submission` message
- [ ] Test: `ActionsService.submitFormAsVisitor()` with invalid data → Expected: throws `BadRequestException`
- [ ] Test: `ActionsService.submitFormAsVisitor()` with no pending form request → Expected: throws `BadRequestException`
- [ ] Test: `ActionsService.submitFormAsVisitor()` with expired form request → Expected: throws `GoneException` (HTTP 410)
- [ ] Test: `ActionsService.updateSubmission()` by owner → Expected: Updates submission data
- [ ] Test: `ActionsService.updateSubmission()` by non-owner without permission → Expected: throws `ForbiddenException`
- [ ] Test: `ActionsService.deleteSubmission()` by agent with permission → Expected: Deletes submission

#### E2E Tests (API Endpoints)

- [ ] Test: `POST /conversations/:id/form-request` with valid body → Expected: 201, message with form_request metadata
- [ ] Test: `POST /conversations/:id/form-request` without auth → Expected: 401 Unauthorized
- [ ] Test: `POST /conversations/:id/form-request` with disabled template → Expected: 400 Bad Request
- [ ] Test: `POST /conversations/:id/form-submit` (visitor) with valid data → Expected: 201, submission created
- [ ] Test: `POST /conversations/:id/form-submit` with invalid data → Expected: 400, validation errors
- [ ] Test: `PUT /submissions/:id` with valid update → Expected: 200, updated submission
- [ ] Test: `DELETE /submissions/:id` with permission → Expected: 204 No Content

### Frontend

#### Integration Tests (Widget Components)

- [ ] Test: `<FormRequestMessage />` renders form fields from definition
- [ ] Test: `<FormRequestMessage />` submit button disabled until required fields filled
- [ ] Test: `<FormRequestMessage />` shows loading state during submission
- [ ] Test: `<FormSubmissionMessage />` renders submitted data read-only

### WebSocket Events

- [ ] Test: `FORM_REQUEST_SENT` emitted to visitor socket when agent sends form
- [ ] Test: `VISITOR_FILLING_FORM` broadcasted to project room when visitor interacts
- [ ] Test: `FORM_SUBMITTED` emitted to both visitor and project room on submission

## 2. Verification Commands

- [ ] Type Check: `npx tsc --noEmit` (from `packages/backend` and `packages/frontend`)
- [ ] Backend Tests: `npm test -- packages/backend/src/actions/actions.service.spec.ts`
- [ ] Gateway Tests: `npm test -- packages/backend/src/gateway/events.gateway.spec.ts`
- [ ] Build: `npm run build`

## 3. Implementation Approach

### Phase 1: Shared Types (Foundation)
Update `shared-types` to add new enums, interfaces, and event types.

### Phase 2: Entity & Migration
Modify `ActionSubmission` entity, generate and run migration.

### Phase 3: Backend Service
Add new methods to `ActionsService` for form request/submit flows.

### Phase 4: Gateway Integration
Add WebSocket event handlers and emitters for real-time form events.

### Phase 5: API Endpoints
Add new controller endpoints for form request and submission.

### Phase 6: Frontend Widget
Implement form rendering and submission in widget.

### Phase 7: Frontend Agent UI
Add "Send Form" button/modal for agents.

## 4. Files to Create/Modify

### Shared Types
| File | Action |
|------|--------|
| `packages/shared-types/src/message.types.ts` | ADD `MessageContentType` enum |
| `packages/shared-types/src/actions.ts` | ADD `FormRequestMetadata`, `FormSubmissionMetadata` interfaces; UPDATE `ActionSubmission` interface |
| `packages/shared-types/src/websocket.types.ts` | ADD form-related events and payloads |

### Backend
| File | Action |
|------|--------|
| `packages/backend/src/actions/entities/action-submission.entity.ts` | MODIFY: Add `visitorId`, `formRequestMessageId` columns; make `creatorId` nullable; add CHECK constraint |
| `packages/backend/src/database/migrations/xxxx-AddVisitorToActionSubmission.ts` | NEW: Migration file |
| `packages/backend/src/actions/actions.service.ts` | MODIFY: Add `sendFormRequest()`, `submitFormAsVisitor()`, `updateSubmission()`, `deleteSubmission()` methods |
| `packages/backend/src/actions/actions.controller.ts` | MODIFY: Add form-request and form-submit endpoints |
| `packages/backend/src/actions/dto/send-form-request.dto.ts` | NEW: DTO for form request |
| `packages/backend/src/actions/dto/submit-form.dto.ts` | NEW: DTO for form submission |
| `packages/backend/src/gateway/events.gateway.ts` | MODIFY: Add `handleVisitorFillingForm()`, emit methods for form events |
| `packages/backend/src/actions/actions.service.spec.ts` | MODIFY: Add tests for new methods |

### Frontend (Widget - Preact)
| File | Action |
|------|--------|
| `packages/frontend/src/widget/components/FormRequestMessage.tsx` | NEW: Component to render form inside chat |
| `packages/frontend/src/widget/components/FormSubmissionMessage.tsx` | NEW: Component to render submitted form |
| `packages/frontend/src/widget/components/Message.tsx` | MODIFY: Handle `form_request` and `form_submission` content types |

### Frontend (Agent Dashboard - React)
| File | Action |
|------|--------|
| `packages/frontend/src/components/features/actions/SendFormModal.tsx` | NEW: Modal for selecting and sending form |
| `packages/frontend/src/services/actionApi.ts` | MODIFY: Add `sendFormRequest()` API call |

## 5. Dependencies

- **Existing**: TypeORM, NestJS, Socket.IO, Preact (widget), React (dashboard)
- **No new external dependencies required**

## 6. Risk Assessment

| Risk | Mitigation |
|------|------------|
| **Database migration on production** | Migration is additive (nullable columns); backward compatible. Run in maintenance window if needed. |
| **Visitor submission without User record** | CHECK constraint ensures exactly one of `creatorId` or `visitorId` is set. Tested explicitly. |
| **Race condition: multiple agents send forms** | INV-5 enforced by querying for pending form before insert. Consider optimistic locking if high concurrency. |
| **Widget bundle size** | New components are small; form rendering reuses existing field components if available. |
