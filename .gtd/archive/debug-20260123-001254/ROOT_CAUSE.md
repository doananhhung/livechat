# Root Cause

**Found:** 2026-01-22
**Status:** CONFIRMED

## Root Cause

`shared-dtos` uses NestJS patterns incompatible with frontend bundlers:

1. **Decorators** (`@ApiProperty`, `@IsString`, etc.) - Require `reflect-metadata` and runtime metadata
2. **Mapped Types** (`PartialType`, `OmitType`) - From `@nestjs/mapped-types`, which depends on `class-transformer/storage` (Node-only)

When frontend imports the package, Vite tries to resolve these dependencies, causing cascading failures.

## Why It Causes The Symptom

1. Frontend imports `@live-chat/shared-dtos`
2. CJS/ESM builds contain decorator imports and calls
3. Vite resolves `@nestjs/mapped-types` → requires `class-transformer/storage`
4. `class-transformer/storage` is Node.js-only → Build fails
