---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Auth API DTO Unification

## Objective

Standards the `authApi.ts` service and its UI consumers to use shared DTOs for type safety and consistency.

## Context

- `packages/frontend/src/services/authApi.ts`
- `packages/shared-dtos/src/forgot-password.dto.ts`
- `packages/shared-dtos/src/reset-password.dto.ts`
- `packages/shared-dtos/src/resend-verification.dto.ts`
- `packages/shared-dtos/src/exchange-code.dto.ts`
- `packages/shared-dtos/src/turn-on-2fa.dto.ts`

## Tasks

<task type="auto">
  <name>Refactor authApi.ts to use shared DTOs</name>
  <files>
    <file>packages/frontend/src/services/authApi.ts</file>
  </files>
  <action>
    - Update function signatures for `resendVerificationEmail`, `verify2FA`, `exchangeCodeForToken`, `forgotPassword`, and `resetPassword` to use the corresponding DTOs as the first argument (`payload`).
    - Remove inline object creation in `api.post` calls, passing the `payload` directly.
    - Export necessary DTO types.
  </action>
  <verify>
    npm run check-types --workspace=@live-chat/frontend
  </verify>
  <done>
    `authApi.ts` functions use DTO types in signatures and compile successfully.
  </done>
</task>

<task type="auto">
  <name>Update Auth UI components to match new service signatures</name>
  <files>
    <file>packages/frontend/src/pages/auth/ResendVerificationPage.tsx</file>
    <file>packages/frontend/src/pages/auth/AuthCallbackPage.tsx</file>
    <file>packages/frontend/src/pages/auth/Verify2faPage.tsx</file>
    <file>packages/frontend/src/pages/auth/ForgotPasswordPage.tsx</file>
    <file>packages/frontend/src/pages/auth/ResetPasswordPage.tsx</file>
  </files>
  <action>
    - Update call sites in UI components to wrap arguments in objects matching the DTO shape (e.g., `resendVerificationEmail({ email })` instead of `resendVerificationEmail(email)`).
    - Ensure `useMutation` hooks in `authApi.ts` correctly pass payload objects.
  </action>
  <verify>
    Check for TypeScript errors in the affected files.
  </verify>
  <done>
    All Auth pages compile without errors and correctly pass DTO-shaped objects to services.
  </done>
</task>

## Success Criteria

- [ ] `authApi.ts` fully utilizes shared DTOs.
- [ ] No regression in Auth-related UI flows.
- [ ] Zero TypeScript errors in `@live-chat/frontend`.
