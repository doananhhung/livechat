# SPEC.md - Fix Relocated Entities

Status: FINALIZED

## Goal

Restore compilation by fixing broken imports after entity relocation.

## Solution

Re-establish `src/database/entities` as a virtual directory via an `index.ts` barrel file that re-exports all entities from their new feature-scoped locations.

## Entities Mapping

- RefreshToken, TwoFactorRecoveryCode -> src/auth/entities
- OutboxEvent -> src/event-consumer/entities
- Conversation, Message -> src/inbox/entities
- EmailChangeRequest, Invitation -> src/mail/entities
- Project, ProjectMember -> src/projects/entities
- User, UserIdentity -> src/users/entities
- Visitor -> src/visitors/entities
- VisitorNote -> src/visitor-notes/entities
- ActionSubmission, ActionTemplate -> src/actions/entities
- CannedResponse -> src/canned-responses/entities
- WebhookDelivery, WebhookSubscription -> src/webhooks/entities
