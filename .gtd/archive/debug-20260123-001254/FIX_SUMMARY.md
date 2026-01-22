# Bug Fix Summary

**Status:** Fixed
**Executed:** 2026-01-22

## Bug Summary

**Symptom:** Frontend failed to import DTOs from `shared-dtos` with various errors related to decorators and NestJS dependencies.

**Root Cause:** `shared-dtos` uses backend-only NestJS patterns (decorators, `PartialType`) incompatible with frontend bundlers.

## What Was Done

Implemented a dual-build system for `shared-dtos`:

1. **Created separate build configs** - CJS, ESM, and frontend builds
2. **Built frontend-safe DTOs** - Script strips decorators from TS source before compiling
3. **Refactored DTOs** - Replaced `PartialType(...)` with explicit optional properties

## Files Changed

- `packages/shared-dtos/package.json` - Added exports, module field, build scripts
- `packages/shared-dtos/tsconfig.cjs.json` (new) - CJS build config
- `packages/shared-dtos/tsconfig.esm.json` (new) - ESM build config
- `packages/shared-dtos/scripts/build-frontend.ts` (new) - Decorator stripping build script
- `packages/shared-dtos/src/visitor-note.dto.ts` - Removed `PartialType`
- `packages/shared-dtos/src/canned-response.dto.ts` - Removed `PartialType`
- `packages/shared-dtos/src/action-template.dto.ts` - Removed `PartialType`

## Proposed Commit Message

```
fix(shared-dtos): enable frontend-compatible build

shared-dtos contained NestJS decorators and mapped-types that failed
when bundled for frontend. Implemented dual-build system.

- Add CJS/ESM/frontend build configurations
- Create decorator-stripping build script for frontend
- Refactor DTOs to remove PartialType (use explicit ?:)
- Add package.json exports with browser condition
```
