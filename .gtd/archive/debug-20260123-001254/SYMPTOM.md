# Bug Symptom

**Reported:** 2026-01-22
**Status:** FIXED

## Expected Behavior

Frontend should start successfully and import DTOs from `@live-chat/shared-dtos`.

## Actual Behavior

Multiple errors occurred when frontend tried to import shared DTOs:

1. `SyntaxError: The requested module does not provide an export named 'JoinRoomDto'`
2. `Could not resolve "class-transformer/storage"`
3. `Reflect.getMetadata is not a function`
4. `Class extends value undefined is not a constructor or null`

## Reproduction Steps

1. Run `npm run dev:frontend`
2. Wait for Vite to build
3. Observe error in console

## Root Cause

`shared-dtos` contained NestJS decorators and `@nestjs/mapped-types` utilities that are backend-only. When consumed by frontend, these dependencies failed to resolve or execute.
