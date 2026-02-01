# Specification

**Status:** FINALIZED
**Created:** 2026-01-31

## Goal

Refactor `AiResponderService` to properly delegate to `WorkflowEngineService`, eliminating duplicated node-handling logic and aligning with the industry-standard state machine executor pattern.

Currently, `AiResponderService._prepareWorkflow` duplicates logic that already exists in `WorkflowEngineService` (handling Condition, Switch, and Action nodes). This makes the engine's handlers dead code and creates maintenance issues.

## Requirements

### Must Have

- [ ] `_prepareWorkflow` calls `workflowEngine.executeStep()` as the single entry point for node processing
- [ ] Use `WorkflowStepResult.requiresRouting` to determine if LLM needs to make a routing decision
- [ ] Use `WorkflowStepResult.routingPrompt` from the engine instead of building prompts locally
- [ ] Remove duplicated Condition/Switch/Action handling logic from `AiResponderService`
- [ ] Modify `handleActionNode` in `WorkflowEngineService` to return `{ requiresRouting: true, routingPrompt, tools }` for LLM-driven tool execution (no hardcoded `toolArgs`)
- [ ] `handleConditionNode`, `handleSwitchNode`, `handleActionNode` in `WorkflowEngineService` are actively used (not dead code)
- [ ] All existing node types (Start, LLM, Condition, Switch, Action) continue to work correctly

### Nice to Have

- [ ] Cleaner separation of concerns: engine handles "what to do at each node", responder handles "how to execute LLM and I/O"
- [ ] Single DB update for conversation metadata per message cycle

### Won't Have

- Changes to the workflow JSON schema
- Changes to the frontend workflow editor
- New node types

## Constraints

- Must not break existing workflow configurations stored in project.aiConfig
- Must maintain backward compatibility with `aiMode: 'simple'` (non-orchestrator mode)
- Existing tests (if any) must pass

## Open Questions

- None
