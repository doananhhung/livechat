---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Settings API DTO Unification

## Objective

Standards the `settingsApi.ts` service and the `SecurityPage.tsx` component to use shared DTOs for 2FA actions and OAuth unlinking.

## Context

- `packages/frontend/src/services/settingsApi.ts`
- `packages/frontend/src/pages/settings/SecurityPage.tsx`
- `packages/shared-dtos/src/turn-on-2fa.dto.ts`

## Tasks

<task type="auto">
  <name>Refactor settingsApi.ts to use TurnOn2faDto</name>
  <files>
    <file>packages/frontend/src/services/settingsApi.ts</file>
  </files>
  <action>
    - Import `TurnOn2faDto` from `@live-chat/shared-dtos`.
    - Update `turnOn2FA` and `disable2FA` signatures to accept `payload: TurnOn2faDto` instead of `code: string`.
    - Use passing `payload` directly in `api.post` calls.
    - Update `useTurnOn2faMutation` and `useDisable2faMutation` to match the new function signatures.
  </action>
  <verify>
    npm run check-types --workspace=@live-chat/frontend
  </verify>
  <done>
    `settingsApi.ts` 2FA functions use DTO types and compile successfully.
  </done>
</task>

<task type="auto">
  <name>Update SecurityPage.tsx to match new 2FA service signatures</name>
  <files>
    <file>packages/frontend/src/pages/settings/SecurityPage.tsx</file>
  </files>
  <action>
    - Update `mutate` calls for `turnOn2FAMutation` and `disable2FAMutation` to pass an object `{ code }` instead of a raw string.
  </action>
  <verify>
    Check `SecurityPage.tsx` for TypeScript errors.
  </verify>
  <done>
    `SecurityPage.tsx` correctly passes DTO-shaped objects to 2FA mutations.
  </done>
</task>

## Success Criteria

- [ ] `settingsApi.ts` 2FA logic fully utilizes shared DTOs.
- [ ] Security settings UI remains functional.
- [ ] Zero TypeScript errors in affected files.
