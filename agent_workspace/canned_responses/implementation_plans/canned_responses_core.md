# Implementation Plan: canned_responses_core

## 1. Acceptance Tests (What "Done" Looks Like)

### API Tests
- [ ] Test: `POST /projects/:id/canned-responses` as Manager -> 201 Created.
- [ ] Test: `POST ...` with duplicate shortcut -> 409 Conflict.
- [ ] Test: `GET /projects/:id/canned-responses` as Agent -> 200 OK (List).
- [ ] Test: `PATCH /:id` as Manager -> 200 OK.
- [ ] Test: `DELETE /:id` as Manager -> 200 OK.
- [ ] Test: Agent trying to Write -> 403 Forbidden.

## 2. Implementation Approach
1.  **Shared:** Define `CannedResponse` interface and DTOs. Rebuild shared packages.
2.  **Database:** Create Entity `CannedResponse`. Generate Migration. Run Migration.
3.  **Backend:**
    *   Create `CannedResponsesModule`.
    *   Implement `CannedResponsesService` (CRUD).
    *   Implement `CannedResponsesController` (Routes + Guards).
4.  **Integration:** Register module in `AppModule` and Entity in `DataSource` config.

## 3. Files to Create/Modify
- `packages/shared-types/src/canned-response.types.ts` — Interface.
- `packages/shared-dtos/src/canned-response.dto.ts` — DTOs.
- `packages/backend/src/canned-responses/entities/canned-response.entity.ts` — DB Entity.
- `packages/backend/src/canned-responses/canned-responses.service.ts` — Logic.
- `packages/backend/src/canned-responses/canned-responses.controller.ts` — API.
- `packages/backend/src/canned-responses/canned-responses.module.ts` — Module.
- `packages/backend/src/database/data-source.ts` — Add Entity.
- `packages/backend/test/canned-responses.e2e-spec.ts` — Tests.

## 4. Dependencies
- `TypeORM` (Unique constraint).
- `class-validator` (Regex validation).

## 5. Risk Assessment
- **Migration:** Ensure unique constraint name is stable.
