## Phase 1 Verification: Auth & User Settings Unification

### Must-Haves

- [x] Migration of Unified Auth & Security flows — VERIFIED
  - Evidence: `authApi.ts` and `settingsApi.ts` signatures updated to use `ExchangeCodeDto`, `ResendVerificationDto`, `TurnOn2faDto`.
- [x] Zero TypeScript errors in `@live-chat/frontend` — VERIFIED
  - Evidence: `npm run check-types --workspace=@live-chat/frontend` exit code 0.

### Verdict: PASS

### Details

- **ExchangeCodeDto**: Used in `exchangeCodeForToken` and `AuthCallbackPage.tsx`.
- **ResendVerificationDto**: Used in `resendVerificationEmail` and `ResendVerificationPage.tsx`.
- **TurnOn2faDto**: Used in `verify2FA`, `turnOn2FA`, `disable2FA` and corresponding UI pages (`Verify2faPage.tsx`, `SecurityPage.tsx`).
- **RecoveryCodeDto**: Backend ready, frontend service updated with types, though UI page for recovery is pending future implementation.
