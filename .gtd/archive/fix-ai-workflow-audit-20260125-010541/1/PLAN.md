---
phase: 1
created: 2026-01-25
---

# Plan: Phase 1 - Explicit System Actor

## Objective

Create a dedicated "System" user in the database to serve as a consistent, auditable actor for all automated AI actions. This foundational change enables proper foreign key relationships and audit trails.

## Context

- ./.gtd/fix-ai-workflow-audit/SPEC.md
- ./.gtd/fix-ai-workflow-audit/ROADMAP.md
- packages/shared-types/src/global-roles.enum.ts
- packages/backend/src/users/entities/user.entity.ts
- packages/backend/src/database/migrations/

## Architecture Constraints

- **Single Source:** `SYSTEM_USER_ID` constant defined in `@live-chat/shared-types`.
- **Invariants:** System user cannot be deleted. System user cannot log in (no password, not email-verified).
- **Resilience:** Migration must be idempotent (check-before-insert).
- **Testability:** N/A for migration.

## Tasks

<task id="1" type="auto">
  <name>Add SYSTEM Role and Constant</name>
  <files>
    packages/shared-types/src/global-roles.enum.ts
    packages/shared-types/src/index.ts
  </files>
  <action>
    1. Add `SYSTEM = "system"` to `GlobalRole` enum in `global-roles.enum.ts`.
    2. Create new file `packages/shared-types/src/system-actor.ts` with:
       - `export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';`
       - `export const SYSTEM_USER_EMAIL = 'system@internal.local';`
    3. Export from `index.ts`.
  </action>
  <done>GlobalRole.SYSTEM exists. SYSTEM_USER_ID constant is exported from @live-chat/shared-types.</done>
</task>

<task id="2" type="auto">
  <name>Create System User Migration</name>
  <files>
    packages/backend/src/database/migrations/{timestamp}-SeedSystemUser.ts
  </files>
  <action>
    Create TypeORM migration that:
    1. In `up()`: Check if user with SYSTEM_USER_ID exists. If not, insert:
       - id: SYSTEM_USER_ID
       - email: SYSTEM_USER_EMAIL
       - role: 'system'
       - status: 'active'
       - passwordHash: null
       - isEmailVerified: false
       - fullName: 'System'
    2. In `down()`: Delete user with SYSTEM_USER_ID.
    
    Use raw SQL for idempotency: `INSERT INTO users (...) SELECT ... WHERE NOT EXISTS`.
  </action>
  <done>Migration file created. Running `npm run migration:run` seeds the System user.</done>
</task>

<task id="3" type="auto">
  <name>Add Deletion Guard</name>
  <files>
    packages/backend/src/users/users.service.ts
  </files>
  <action>
    In `UsersService.delete()` or equivalent method:
    1. Import `SYSTEM_USER_ID` from `@live-chat/shared-types`.
    2. Before deletion, check if `userId === SYSTEM_USER_ID`. If so, throw `ForbiddenException('Cannot delete system user')`.
  </action>
  <done>Attempting to delete user with SYSTEM_USER_ID throws ForbiddenException.</done>
</task>

## Success Criteria

- [ ] `GlobalRole.SYSTEM` is a valid enum value.
- [ ] `SYSTEM_USER_ID` constant is exported from shared-types.
- [ ] System user exists in database after migration.
- [ ] System user cannot be deleted via API.
