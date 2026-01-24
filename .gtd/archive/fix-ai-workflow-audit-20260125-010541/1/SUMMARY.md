# Phase 1 Summary

**Status:** Complete
**Executed:** 2026-01-25

## What Was Done

Created a dedicated "System" user in the database to serve as a consistent, auditable actor for all automated AI actions. This foundational change enables proper foreign key relationships and audit trails.

## Behaviour

**Before:** AI actions used a hardcoded string `'system'` for actor identification, which had no corresponding user in the database.
**After:** AI actions can now use `SYSTEM_USER_ID` which references an actual user record with `role: 'system'`. This user cannot be deleted.

## Tasks Completed

1. ✓ Add SYSTEM Role and Constant
   - Added `SYSTEM = "system"` to `GlobalRole` enum
   - Created `system-actor.ts` with `SYSTEM_USER_ID` and `SYSTEM_USER_EMAIL` constants
   - Exported from `@live-chat/shared-types` index
   - Files: `global-roles.enum.ts`, `system-actor.ts`, `index.ts`

2. ✓ Create System User Migration
   - Created `AddSystemRole` migration to add 'system' to `users_role_enum`
   - Created `SeedSystemUser` migration to insert the System user
   - Both migrations executed successfully
   - Files: `1769276486377-AddSystemRole.ts`, `1769276486378-SeedSystemUser.ts`

3. ✓ Add Deletion Guard
   - Added `delete()` method to `UserService` with `SYSTEM_USER_ID` check
   - Throws `ForbiddenException` when attempting to delete System user
   - Files: `user.service.ts`

## Deviations

- Fixed migration column names from camelCase to snake_case (matching actual DB schema)
- Renamed SeedSystemUser migration to run after AddSystemRole (timestamp adjustment)

## Success Criteria

- [x] `GlobalRole.SYSTEM` is a valid enum value
- [x] `SYSTEM_USER_ID` constant is exported from shared-types
- [x] System user exists in database after migration
- [x] System user cannot be deleted via API

## Files Changed

- `packages/shared-types/src/global-roles.enum.ts` — Added SYSTEM role
- `packages/shared-types/src/system-actor.ts` — New file with constants
- `packages/shared-types/src/index.ts` — Export system-actor
- `packages/backend/src/database/migrations/1769276486377-AddSystemRole.ts` — New migration
- `packages/backend/src/database/migrations/1769276486378-SeedSystemUser.ts` — New migration
- `packages/backend/src/users/user.service.ts` — Added delete() with guard

## Proposed Commit Message

feat(users): add dedicated System user for AI actions

Implements a dedicated System user in the database for automated AI
actions, providing proper audit trails and foreign key relationships.

- Add GlobalRole.SYSTEM enum value
- Create SYSTEM_USER_ID and SYSTEM_USER_EMAIL constants in shared-types
- Add migration to seed System user (id: 00000000-0000-0000-0000-000000000001)
- Add deletion guard in UserService to prevent System user deletion
