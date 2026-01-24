# Phase 3 Summary

**Status:** Complete
**Executed:** 2026-01-25

## What Was Done

Centralized AI workflow tool definitions in `@live-chat/shared-types` to eliminate the "Manual Sync" maintenance risk identified in the audit. Both backend and frontend now import tool names from a Single Source of Truth.

## Behaviour

**Before:** Tool names (`add_visitor_note`, `change_status`, `send_form`) were hardcoded as strings in 3 separate files: `ai-tool.executor.ts`, `NodeConfigPanel.tsx`, and `GlobalToolsPanel.tsx`. Adding a new tool required updating all three files manually.
**After:** All tool names are defined in `AiToolName` enum in shared-types. Frontend and backend import from this single source. Adding a new tool requires only updating the shared definition.

## Tasks Completed

1. ✓ Create Shared Tool Definitions
   - Created `ai-tools.ts` with `AiToolName` enum
   - Added `AVAILABLE_ACTION_TOOLS` array for UI-selectable tools
   - Added `AI_TOOL_LABEL_KEYS` and `AI_TOOL_CONFIG_LABEL_KEYS` for i18n
   - Exported from `index.ts`
   - Files: `ai-tools.ts`, `index.ts`

2. ✓ Update Backend and Frontend to Use Shared Definitions
   - Updated `ai-tool.executor.ts` to use `AiToolName` enum in tool definitions and switch cases
   - Updated `GlobalToolsPanel.tsx` to iterate over `AVAILABLE_ACTION_TOOLS`
   - Updated `NodeConfigPanel.tsx` to generate options dynamically and use enum in conditionals
   - Files: `ai-tool.executor.ts`, `GlobalToolsPanel.tsx`, `NodeConfigPanel.tsx`

## Deviations

None

## Success Criteria

- [x] `AiToolName` enum is defined in `@live-chat/shared-types`
- [x] `AVAILABLE_ACTION_TOOLS` array is exported from shared-types
- [x] `ai-tool.executor.ts` uses `AiToolName` enum values
- [x] `GlobalToolsPanel.tsx` uses shared definitions
- [x] `NodeConfigPanel.tsx` uses shared definitions
- [x] Both backend and frontend compile without errors

## Files Changed

- `packages/shared-types/src/ai-tools.ts` — New file with centralized tool definitions
- `packages/shared-types/src/index.ts` — Export ai-tools
- `packages/backend/src/ai-responder/services/ai-tool.executor.ts` — Use AiToolName enum
- `packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx` — Use shared definitions
- `packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx` — Use shared definitions

## Proposed Commit Message

refactor(ai-tools): centralize tool definitions in shared-types

Eliminates "Manual Sync" maintenance risk by moving AI tool names to
a Single Source of Truth in @live-chat/shared-types.

- Add AiToolName enum with all tool names
- Add AVAILABLE_ACTION_TOOLS for UI-selectable tools
- Add i18n label key mappings
- Update ai-tool.executor.ts to use enum
- Update GlobalToolsPanel and NodeConfigPanel to import from shared
