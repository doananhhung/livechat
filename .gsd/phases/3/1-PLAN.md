---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Project & Invitation API DTO Unification

## Objective

Standardize `projectApi.ts` and its consumers to use shared DTOs for project management, widget settings, and the invitation lifecycle.

## Context

- `packages/frontend/src/services/projectApi.ts`
- `packages/shared-dtos/src/invitation.dto.ts`
- `packages/shared-dtos/src/widget-settings.dto.ts`
- `packages/shared-dtos/src/update-project.dto.ts`
- `packages/shared-dtos/src/create-project.dto.ts`
- `packages/frontend/src/pages/invitations/AcceptInvitationPage.tsx`
- `packages/frontend/src/pages/auth/RegisterPage.tsx`
- `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx`
- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx`

## Proposed Changes

### [MODIFY] [projectApi.ts](file:///home/hoang/node/live_chat/packages/frontend/src/services/projectApi.ts)

- Update `updateProjectSettings`, `acceptInvitation`, `getInvitationDetails` to use DTOs.

### [MODIFY] [AcceptInvitationPage.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/pages/invitations/AcceptInvitationPage.tsx)

- Update `acceptInvitation` call to pass `{ token }`.

### [MODIFY] [RegisterPage.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/pages/auth/RegisterPage.tsx)

- Update `acceptInvitation` call to pass `{ token }`.

### [MODIFY] [ProjectWidgetSettingsDialog.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx)

- Replace `IWidgetSettingsDto` with `WidgetSettingsDto`.

### [MODIFY] [ProjectSettingsPage.tsx](file:///home/hoang/node/live_chat/packages/frontend/src/pages/settings/ProjectSettingsPage.tsx)

- Update `updateProjectSettings` call.

## Tasks

<task type="auto">
  <name>Refactor projectApi.ts to use DTOs</name>
  <files>
    <file>packages/frontend/src/services/projectApi.ts</file>
  </files>
  <action>
    - Import `AcceptInvitationDto`, `InvitationResponseDto`, `WidgetSettingsDto` from `@live-chat/shared-dtos`.
    - Refactor `updateProjectSettings` to accept `settings: WidgetSettingsDto`.
    - Refactor `acceptInvitation` to accept `payload: AcceptInvitationDto`.
    - Refactor `getInvitationDetails` to return `Promise<InvitationResponseDto>`.
  </action>
  <verify>
    Check for TypeScript errors in `projectApi.ts`.
  </verify>
  <done>
    Project API functions use shared DTOs.
  </done>
</task>

<task type="auto">
  <name>Update Project & Invitation UI components</name>
  <files>
    <file>packages/frontend/src/pages/invitations/AcceptInvitationPage.tsx</file>
    <file>packages/frontend/src/pages/auth/RegisterPage.tsx</file>
    <file>packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx</file>
    <file>packages/frontend/src/pages/settings/ProjectSettingsPage.tsx</file>
  </files>
  <action>
    - Update call sites to pass `{ token }` for `acceptInvitation`.
    - Replace `IWidgetSettingsDto` with `WidgetSettingsDto` in `ProjectWidgetSettingsDialog.tsx`.
    - Ensure `ProjectSettingsPage.tsx` correctly types the data passed to `updateProjectSettings`.
  </action>
  <verify>
    npm run check-types --workspace=@live-chat/frontend
  </verify>
  <done>
    UI components are type-safe and functional with new DTO payloads.
  </done>
</task>

## Success Criteria

- [ ] Project and Invitation flows use shared DTOs.
- [ ] No regression in Project management functionality.
