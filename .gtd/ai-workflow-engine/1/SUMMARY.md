# Phase 1 Summary

**Status:** Complete
**Executed:** 2026-01-24

## What Was Done

Built the backend core for the AI Workflow Engine. This phase focused on creating the tool execution infrastructure and the initial version of the workflow state machine. The AI can now execute `change_status` and `send_form` tools, and its behavior can be guided by a visual graph configuration (WorkflowDefinition).

## Behaviour

**Before:**
- AI tools were hardcoded within the `AiResponderService`.
- Only `add_visitor_note` was supported.
- AI logic was limited to a single global system prompt.

**After:**
- AI tools are encapsulated in a dedicated `AiToolExecutor` service.
- Supported tools now include `add_visitor_note`, `change_status`, and `send_form`.
- `AiResponderService` supports a graph-based workflow. It can load a `WorkflowDefinition` from the project configuration and determine the specific `systemPrompt` and `tools` based on the current "Node" of the conversation.
- The system supports `WorkflowNode` types like `start`, `action`, and `condition`.

## Tasks Completed

1. ✓ Implement Missing Tools
   - Created `AiToolExecutor` to handle tool execution logic.
   - Implemented `change_status` (ConversationStatus) and `send_form` (ActionsService integration).
   - Files: `packages/backend/src/ai-responder/services/ai-tool.executor.ts`

2. ✓ Define Workflow Schema
   - Defined `WorkflowNode`, `WorkflowEdge`, and `WorkflowDefinition` in shared-types.
   - Updated `Project` entity to strictly type `aiConfig` as `WorkflowDefinition`.
   - Files: `packages/shared-types/src/workflow.types.ts`, `packages/backend/src/projects/entities/project.entity.ts`, `packages/shared-types/src/index.ts`

3. ✓ Implement Workflow Engine Logic
   - Created `WorkflowEngineService` to handle node traversal and context generation.
   - Integrated the engine into `AiResponderService`.
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.ts`, `packages/backend/src/ai-responder/ai-responder.module.ts`, `packages/backend/src/ai-responder/ai-responder.service.ts`

## Deviations

- None.

## Success Criteria

- [x] `AiResponderService` can execute `change_status` and `send_form`.
- [x] Workflow schema is defined in shared-types.
- [x] Basic State Machine logic exists (can move from Start -> Next Node).

## Files Changed

- `packages/backend/src/ai-responder/services/ai-tool.executor.ts`
- `packages/backend/src/ai-responder/services/workflow-engine.service.ts`
- `packages/backend/src/ai-responder/ai-responder.service.ts`
- `packages/backend/src/ai-responder/ai-responder.module.ts`
- `packages/backend/src/projects/entities/project.entity.ts`
- `packages/shared-types/src/workflow.types.ts`
- `packages/shared-types/src/index.ts`

## Proposed Commit Message

feat(ai-workflow): implement core backend engine and expanded toolset

- Create AiToolExecutor for modular tool management
- Add change_status and send_form tools for AI agent
- Define WorkflowDefinition schema in shared-types
- Implement WorkflowEngineService for graph-based logic traversal
- Integrate workflow state lookup into AiResponderService
