# ROADMAP.md

> **Current Milestone**: Frontend DTO Unification
> **Goal**: Replace all ad-hoc types and partial objects in the frontend with valid DTOs from `@live-chat/shared-dtos`.

## Must-Haves

- [x] Migration of Unified Auth & Security flows.
- [x] Migration of Inbox & Messaging flows.
- [x] Migration of Project Management & Invitations.
- [ ] Migration of Widget Socket & Actions.
- [ ] Deletion of truly orphaned DTOs (`InvitationResponseDto`, `ReplyToCommentDto`).

## Phases

### Phase 1: Auth & User Settings Unification

**Status**: ✅ Complete
**Objective**: Unified DTO adoption for Authentication and Security.
**Included DTOs**:

- `ExchangeCodeDto`
- `RecoveryCodeDto`
- `ResendVerificationDto`
- `TurnOn2faDto`
  **Affected Services**: `authApi.ts`, `settingsApi.ts`

### Phase 2: Inbox & Conversation Management

**Status**: ⬜ Not Started
**Objective**: Unified DTO adoption for the Inbox and Visitor management.
**Included DTOs**:

- `AgentTypingDto`
- `ListMessagesDto`
- `SendReplyDto`
- `VisitorResponseDto`
  **Affected Services**: `inboxApi.ts`, `visitorApi.ts`

### Phase 3: Project & Invitation Lifecycle

**Status**: ⬜ Not Started
**Objective**: Unified DTO adoption for Project administration and the updated Invitation flow.
**Included DTOs**:

- `AcceptInvitationDto`
- `InvitationResponseDto` (Refactored)
  **Affected Services**: `projectApi.ts`

### Phase 4: Widget & Action Submissions

**Status**: ⬜ Not Started
**Objective**: Unified DTO adoption for the Visitor Widget and Dynamic Actions.
**Included DTOs**:

- `ActionDefinitionDto`
- `ActionFieldDefinitionDto`
- `CreateActionSubmissionDto`
- `SubmitFormAsVisitorDto`
- `UpdateSubmissionDto`
- `VisitorFillingFormDto`
  **Affected Services**: `socketService.ts`, Widget Action components

### Phase 5: Final Verification & Orphan Cleanup

**Status**: ⬜ Not Started
**Objective**: Delete orphaned code and perform final global type validation.
**Tasks**:

- [ ] Delete `InvitationResponseDto` (if determined redundant after refactor).
- [ ] Delete `ReplyToCommentDto`.
- [ ] Run `npm run check-types` across monorepo.
