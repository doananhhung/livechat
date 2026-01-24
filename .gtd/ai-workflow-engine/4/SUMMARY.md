# Phase 4 Summary

**Status:** Complete
**Executed:** 2026-01-24

## What Was Done

Expanded the AI Workflow Engine with advanced configuration capabilities. This phase implemented **Variable Injection** (allowing prompts to use `{{visitor.name}}`) and **Global Tools** (allowing admins to define tools that are available across all workflow nodes).

## Behaviour

**Before:**
- Prompts were static text.
- Tools had to be explicitly enabled per node (if supported) or defaulted to all.
- No UI to toggle global tool availability.

**After:**
- **Variable Injection:** The `WorkflowEngineService` now scans prompts for `{{variable}}` patterns and replaces them with live data from the `Visitor`, `Conversation`, or `Project` entities.
- **Global Tools:** The `WorkflowDefinition` schema now includes a `globalTools` array.
- **Node Context:** The `getNodeContext` method automatically merges global tools with node-specific tools.
- **Editor UI:** The Workflow Editor includes a persistent "Global Tools" panel to toggle `add_visitor_note` and `change_status` availability for the entire workflow.

## Tasks Completed

1. ✓ Implement Variable Injection
   - Updated `WorkflowEngineService.getNodeContext` to accept a context object.
   - Implemented regex-based replacement for `{{visitor.*}}`, `{{conversation.*}}`, etc.
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

2. ✓ Implement Global Tools
   - Updated `WorkflowDefinition` schema in `shared-types`.
   - Updated `WorkflowEngineService` to merge global tools.
   - Added UI controls for Global Tools in `WorkflowEditor.tsx`.
   - Updated persistence logic in `WorkflowBuilderModal.tsx`.
   - Files: `packages/shared-types/src/workflow.types.ts`, `packages/backend/src/ai-responder/services/workflow-engine.service.ts`, `packages/frontend/src/components/features/workflow/WorkflowEditor.tsx`, `packages/frontend/src/components/features/workflow/WorkflowBuilderModal.tsx`

## Deviations

- None.

## Success Criteria

- [x] AI prompts effectively use visitor names/data.
- [x] Global tools (like Add Note) work even in nodes that don't explicitly define them.

## Files Changed

- `packages/shared-types/src/workflow.types.ts`
- `packages/backend/src/ai-responder/services/workflow-engine.service.ts`
- `packages/frontend/src/components/features/workflow/WorkflowEditor.tsx`
- `packages/frontend/src/components/features/workflow/WorkflowBuilderModal.tsx`
- `packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx` (Type fix)
- `packages/frontend/src/components/features/workflow/nodes/LlmNode.tsx` (Type fix)
- `packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx` (Type fix)
- `packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx` (Type fix)

## Proposed Commit Message

feat(ai-workflow): add variable injection and global tools

- Support {{variable}} syntax in AI prompts (visitor/conversation/project data)
- Implement global tools configuration in workflow schema
- Add UI controls for enabling global tools in Workflow Editor
- Fix type definitions for React Flow node components
