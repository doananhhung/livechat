# Phase 1 Summary

**Status:** Complete
**Executed:** 2026-01-24

## What Was Done

Refactored the Global Tools system from a simple checkbox list to a fully configurable panel. Each tool now has an enable toggle AND an instruction field describing when the AI should call it. Updated the data model, frontend components, and backend to support this new structure.

## Behaviour

**Before:** Global Tools panel had simple checkboxes. Users could only enable/disable tools with no guidance for the AI about when to use them. Data stored as `string[]`.

**After:** Global Tools panel shows each tool with a checkbox and (when enabled) a textarea for custom instructions. AI receives these instructions appended to its system prompt. Data stored as `GlobalToolConfig[]` with backward compatibility for old format.

## Tasks Completed

1. ✓ Update shared-types and add GlobalToolConfig interface
   - Added `GlobalToolConfig` interface with `name`, `enabled`, `instruction` fields
   - Updated `WorkflowDefinition.globalTools` type
   - Added `sourceHandle` and `targetHandle` to `WorkflowEdge` for branching support
   - Improved type safety: `any` → `unknown` in Record types
   - Files: `workflow.types.ts`

2. ✓ Create GlobalToolsPanel component and integrate into WorkflowEditor
   - Created `GlobalToolsPanel.tsx` with per-tool configuration
   - Updated `WorkflowEditor.tsx` to use new component and type
   - Updated `AiResponderSettingsForm.tsx` with migration for old format
   - Added i18n keys to `en.json` and `vi.json`
   - Files: `GlobalToolsPanel.tsx`, `WorkflowEditor.tsx`, `AiResponderSettingsForm.tsx`, `en.json`, `vi.json`

3. ✓ Update backend to use new GlobalToolConfig structure
   - Updated `getNodeContext()` to handle new format
   - Added backward compatibility for old `string[]` format
   - Injects tool instructions into system prompt under "Global Tool Usage Guidelines"
   - Files: `workflow-engine.service.ts`

## Deviations

- Added `sourceHandle` and `targetHandle` to `WorkflowEdge` for Phase 2 branching support (preemptive)
- Fixed type safety: changed `Record<string, any>` to `Record<string, unknown>` in shared types

## Success Criteria

- [x] GlobalToolConfig interface defined in shared-types
- [x] GlobalToolsPanel component with enable toggle + instruction textarea per tool
- [x] WorkflowEditor uses new data structure
- [x] Backend injects instructions into LLM prompts
- [x] All UI labels are i18n-ized

## Files Changed

- `packages/shared-types/src/workflow.types.ts` — Added GlobalToolConfig, updated types
- `packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx` — NEW: configurable tools panel
- `packages/frontend/src/components/features/workflow/WorkflowEditor.tsx` — Uses GlobalToolsPanel
- `packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx` — Updated types with migration
- `packages/frontend/src/i18n/locales/en.json` — Added globalTools namespace
- `packages/frontend/src/i18n/locales/vi.json` — Added globalTools namespace
- `packages/backend/src/ai-responder/services/workflow-engine.service.ts` — Handles new format with instructions

## Proposed Commit Message

feat(workflow): refactor Global Tools to support per-tool instructions

- Add GlobalToolConfig interface with name, enabled, instruction fields
- Create GlobalToolsPanel component with configurable UI
- Inject tool instructions into AI system prompt
- Maintain backward compatibility with old string[] format
- Add i18n support for new UI elements (en/vi)
