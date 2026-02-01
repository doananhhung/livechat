# Phase 1 Summary

**Status:** Complete
**Executed:** 2026-01-31

## What Was Done

Refactored `WorkflowEngineService` to support the industry-standard LLM orchestrator pattern where Action nodes are LLM-driven (not auto-executed). Added the `tools` property to `WorkflowStepResult` interface and ensured all routing node types (Condition, Switch, Action) return consistent results that include everything the caller needs to invoke the LLM.

## Behaviour

**Before:** Action nodes would auto-execute tools with hardcoded `toolArgs`. Condition and Switch nodes returned routing prompts but no tool definitions.

**After:** Action nodes return `{ requiresRouting: true, routingPrompt, tools }`, requiring the LLM to determine tool arguments based on conversation context. All routing nodes now uniformly include the specific tool definition in their result.

## Tasks Completed

1. ✓ Create Failing Test for LLM-Driven Action Node
   - Created `workflow-engine.service.spec.ts` with TDD test
   - Confirmed test failed (Red state) before implementation
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts`

2. ✓ Refactor handleActionNode to be LLM-driven
   - Removed `executeTool` call from `handleActionNode`
   - Changed method from `async` to sync
   - Now returns routing context with `requiresRouting: true`, `routingPrompt`, and `tools`
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

3. ✓ Standardize Switch and Condition Handlers
   - Added `tools: [this.toolExecutor.getRoutingTool()]` to `handleConditionNode`
   - Added `tools: [this.toolExecutor.getSwitchTool(caseNames)]` to `handleSwitchNode`
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

## Deviations

- Added `tools?: ToolDefinition[]` to `WorkflowStepResult` interface (not explicitly in plan but required for implementation).

## Success Criteria

- [x] `handleActionNode` returns instructions for LLM, does not execute side effects.
- [x] `WorkflowStepResult` interface supports returning `tools` directly.
- [x] All three routing node types return consistent StepResult shapes.
- [x] Unit tests pass for Action node handling.

## Files Changed

- `packages/backend/src/ai-responder/services/workflow-engine.service.ts` — Refactored `handleActionNode`, added `tools` to Condition/Switch handlers, added `tools` property to interface
- `packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts` — New test file for TDD

## Proposed Commit Message

refactor(ai-responder): make action nodes LLM-driven in WorkflowEngineService

Previously, action nodes auto-executed tools with hardcoded arguments.
Now they return routing context for the LLM to determine arguments
dynamically based on conversation context.

- Add `tools` property to WorkflowStepResult interface
- Refactor handleActionNode to return routing context instead of executing
- Add tools array to Condition and Switch node handlers
- Add unit tests for action node behavior
