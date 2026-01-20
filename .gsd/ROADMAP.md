# ROADMAP.md

> **Current Milestone**: Frontend DTO Unification
> **Goal**: Replace all ad-hoc types and partial objects in the frontend with valid DTOs from `@live-chat/shared-dtos`.

## Must-Haves

- [ ] Migration of `authApi.ts` and `settingsApi.ts` to shared DTOs.
- [ ] Migration of `inboxApi.ts` and `visitorApi.ts` to shared DTOs.
- [ ] Migration of `projectApi.ts` (including new `InvitationResponseDto`) to shared DTOs.
- [ ] Migration of widget `socketService.ts` to shared DTOs.
- [ ] Zero TypeScript errors in `packages/frontend` related to DTO usage.

## Phases

### Phase 1: Auth & User Settings Unification

**Status**: ⬜ Not Started
**Objective**: Update authentication and profile settings services to use shared DTOs for login, registration, and user updates.

### Phase 2: Inbox & Conversation Management Unification

**Status**: ⬜ Not Started
**Objective**: Standardize conversation lists, messaging, and agent typing status using shared inbox-related DTOs.

### Phase 3: Project & Invitation Lifecycle Unification

**Status**: ⬜ Not Started
**Objective**: Refactor project management and invitation flows, utilizing the newly updated `InvitationResponseDto`.

### Phase 4: Widget & Action Submissions Unification

**Status**: ⬜ Not Started
**Objective**: Ensure the widget uses shared DTOs for socket communication and form submissions, eliminating the `SubmitFormDto` vs `SubmitFormAsVisitorDto` confusion.

### Phase 5: Final Verification & Cleanup

**Status**: ⬜ Not Started
**Objective**: Run comprehensive type checks and regression tests to ensure end-to-end functionality remains intact.
