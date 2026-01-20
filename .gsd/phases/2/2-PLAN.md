---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Visitor API & Response DTO Unification

## Objective

Standardize visitor-related data exchange to use `VisitorResponseDto` and ensure all visitor API interactions are DTO-compliant.

## Context

- `packages/frontend/src/services/inboxApi.ts`
- `packages/frontend/src/services/visitorApi.ts`
- `packages/shared-dtos/src/visitor-response.dto.ts`

## Proposed Changes

### [MODIFY] [inboxApi.ts](file:///home/hoang/node/live_chat/packages/frontend/src/services/inboxApi.ts)

- Update `getVisitorById` to return `Promise<VisitorResponseDto>`.
- Update `useGetVisitor` hook to reflect the return type.

### [MODIFY] [visitorApi.ts](file:///home/hoang/node/live_chat/packages/frontend/src/services/visitorApi.ts)

- Ensure all functions return or accept appropriate DTOs where applicable.

## Tasks

<task type="auto">
  <name>Refactor Visitor retrieval to use VisitorResponseDto</name>
  <files>
    <file>packages/frontend/src/services/inboxApi.ts</file>
  </files>
  <action>
    - Import `VisitorResponseDto` from `@live-chat/shared-dtos`.
    - Update `getVisitorById` to return `Promise<VisitorResponseDto>`.
    - Ensure `useGetVisitor` is correctly typed.
  </action>
  <verify>
    Check `inboxApi.ts` and `VisitorContextPanel.tsx` for type correctness.
  </verify>
  <done>
    `getVisitorById` returns `VisitorResponseDto`.
  </done>
</task>

## Success Criteria

- [ ] Visitor data is exchanged using `VisitorResponseDto`.
- [ ] Type consistency across visitor management components.
