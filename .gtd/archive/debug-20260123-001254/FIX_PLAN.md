# Fix Plan

**Created:** 2026-01-22
**Status:** EXECUTED

## Root Cause Summary

`shared-dtos` decorators and `PartialType` utilities are backend-only, causing frontend build failures.

## Fix Approach

1. **Dual build** - Separate CJS, ESM, and frontend builds
2. **Source-level decorator stripping** - Pre-process TS to remove decorators before frontend build
3. **Refactor PartialType usage** - Replace with explicit optional properties

## Tasks

### Task 1: Create dual build configuration

- Add `tsconfig.cjs.json` for CommonJS
- Add `tsconfig.esm.json` for ESM
- Create `scripts/build-frontend.ts` to strip decorators

### Task 2: Update package.json exports

- Add `browser` condition pointing to `dist/frontend/`
- Update build script to run all three builds

### Task 3: Refactor DTOs using PartialType

- `visitor-note.dto.ts` - Replace `extends PartialType(...)` with explicit `?:` properties
- `canned-response.dto.ts` - Same
- `action-template.dto.ts` - Same

## Success Criteria

- [x] Frontend loads without decorator-related errors
- [x] Backend still works with full decorator support
- [x] Single source of truth for DTO definitions
