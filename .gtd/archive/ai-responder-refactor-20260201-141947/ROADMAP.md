# Roadmap

**Spec:** ./.gtd/ai-responder-refactor/SPEC.md
**Goal:** Refactor `AiResponderService` to properly delegate to `WorkflowEngineService`, eliminating duplicated node-handling logic.
**Created:** 2026-01-31

## Must-Haves

- [ ] `_prepareWorkflow` calls `workflowEngine.executeStep()` as the single entry point for node processing
- [ ] Use `WorkflowStepResult.requiresRouting` to determine if LLM needs to make a routing decision
- [ ] Use `WorkflowStepResult.routingPrompt` from the engine instead of building prompts locally
- [ ] Remove duplicated Condition/Switch/Action handling logic from `AiResponderService`
- [ ] Modify `handleActionNode` in `WorkflowEngineService` to return `{ requiresRouting: true, routingPrompt, tools }` for LLM-driven tool execution
- [ ] `handleConditionNode`, `handleSwitchNode`, `handleActionNode` in `WorkflowEngineService` are actively used
- [ ] All existing node types (Start, LLM, Condition, Switch, Action) continue to work correctly

## Nice-To-Haves

- [ ] Cleaner separation of concerns
- [ ] Single DB update for conversation metadata per message cycle

## Phases

### Phase 1: Engine Logic Updates

**Status**: ✅ Complete
**Objective**: Update `WorkflowEngineService` to support the new LLM-driven action node pattern and ensure all handlers return the correct routing context.

- Update `handleActionNode` to return `requiresRouting: true` and a prompt for the LLM instead of auto-executing.
- Verify `handleConditionNode` and `handleSwitchNode` return robust prompts with tools.
- Ensure `executeStep` correctly delegates to these handlers.

### Phase 2: Responder Integration

**Status**: ✅ Complete
**Objective**: Refactor `AiResponderService` to use the engine's new capabilities and remove duplicated logic.

- Rewrite `_prepareWorkflow` to call `workflowEngine.executeStep`.
- Update `_prepareWorkflow` to map `WorkflowStepResult` (routing/LLM) to the context needed for `_generateLlmResponse`.
- Remove all local node type switching logic (dead code removal) from `AiResponderService`.

### Phase 3: Cleanup & Optimization

**Status**: ✅ Complete
**Objective**: Finalize the refactor with nice-to-haves and verify system integrity.

- Optimize the DB update loop in `_finalizeResponse` (Single DB update).
- Verify standard architecture compliance (Review).
- Ensure backward compatibility with simple mode.
