## Phase 3 Verification: Project & Invitation Lifecycle Unification

### Must-Haves

- [x] Migration of Project Management & Invitations — VERIFIED
  - Evidence: `projectApi.ts` using `AcceptInvitationDto`, `InvitationResponseDto`, `WidgetSettingsDto`.
  - Evidence: Components updated to pass matching payloads for invitation acceptance and project settings.
- [x] Zero TypeScript errors in `@live-chat/frontend` — VERIFIED
  - Evidence: `npm run check-types --workspace=@live-chat/frontend` exit code 0.

### Verdict: PASS

### Details

- **AcceptInvitationDto**: Used for accepting invitations with tokens.
- **InvitationResponseDto**: Replaced the local `InvitationWithProject` interface.
- **WidgetSettingsDto**: Replaced the legacy `IWidgetSettingsDto` across project and widget services/stores.
