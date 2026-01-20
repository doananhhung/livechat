---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Widget Socket & Action DTO Unification

## Objective

Standardize widget WebSocket events and dynamic action handling by moving ad-hoc types to shared DTOs and unifying redundant form submission types.

## Context

- `packages/frontend/src/widget/services/socketService.ts`
- `packages/frontend/src/widget/components/FormRequestMessage.tsx`
- `packages/shared-dtos/src/gateway.dto.ts`
- `packages/shared-dtos/src/submit-form-as-visitor.dto.ts`
- `packages/shared-types/src/index.ts`

## Proposed Changes

### [MODIFY] [gateway.dto.ts](file:///home/hoang/node/live_chat/packages/shared-dtos/src/gateway.dto.ts)

- [DELETE] `SubmitFormDto` (replace with `SubmitFormAsVisitorDto`).
- Ensure `VisitorFillingFormDto` is correctly defined and exported.

### [NEW] [action-definition.dto.ts](file:///home/hoang/node/live_chat/packages/shared-dtos/src/action-definition.dto.ts)

- Define `ActionDefinitionDto` and `ActionFieldDefinitionDto` (migrated from `shared-types`).

### [MODIFY] [socketService.ts](file:///home/hoang/node/live_chat/packages/frontend/src/widget/services/socketService.ts)

- Change `emitSubmitForm` to use `SubmitFormAsVisitorDto`.
- Update imports to use unified shared DTOs.

### [MODIFY] [FormRequestMessage.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/widget/components/FormRequestMessage.tsx)

- Update component to use `ActionFieldDefinitionDto` and related DTOs for type safety.

## Tasks

<task type="auto">
  <name>Migrate Action Types to Shared DTOs</name>
  <files>
    <file>packages/shared-dtos/src/action-definition.dto.ts</file>
    <file>packages/shared-dtos/src/gateway.dto.ts</file>
    <file>packages/shared-dtos/src/index.ts</file>
  </files>
  <action>
    - Create `action-definition.dto.ts` and define `ActionDefinitionDto` / `ActionFieldDefinitionDto`.
    - Delete `SubmitFormDto` from `gateway.dto.ts`.
    - Export new DTOs from `index.ts`.
  </action>
  <verify>
    Check shared-dtos builds successfully.
  </verify>
  <done>
    Action-related DTOs are available in the shared package.
  </done>
</task>

<task type="auto">
  <name>Refactor Widget socket and components</name>
  <files>
    <file>packages/frontend/src/widget/services/socketService.ts</file>
    <file>packages/frontend/src/widget/components/FormRequestMessage.tsx</file>
  </files>
  <action>
    - Update `socketService.ts` to use `SubmitFormAsVisitorDto`.
    - Update `FormRequestMessage.tsx` to use new shared types/DTOs.
  </action>
  <verify>
    npm run check-types --workspace=@live-chat/frontend
  </verify>
  <done>
    Widget implementation uses standard shared DTOs for actions.
  </done>
</task>

## Success Criteria

- [ ] Redundant `SubmitFormDto` removed.
- [ ] Widget actions are fully typed with shared DTOs.
- [ ] WebSocket events for form interactions are standardized.
