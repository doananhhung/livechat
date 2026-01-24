# Specification

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Make the AI Workflow Orchestrator fully functional by wiring the WorkflowEngineService into AiResponderService so that workflows actually execute, advance through nodes, and persist state across messages.

Currently, the orchestrator mode only fetches the system prompt for the current node but never advances the workflow or persists state. This makes the workflow effectively useless.

## Requirements

### Must Have

- [ ] **LLM node handling** — Add `case 'llm'` in `WorkflowEngineService.executeStep()` that returns the node's prompt and advances to next node
- [ ] **Persist workflow state** — Save `workflowState.currentNodeId` to `conversation.metadata` after each step
- [ ] **Handle requiresRouting** — When `WorkflowStepResult.requiresRouting` is true, inject `route_decision` tool and process LLM's path choice via `processRouteDecision()`
- [ ] **Advance workflow after LLM response** — After LLM responds (non-routing), advance `currentNodeId` to next node based on edges
- [ ] **Auto-execute Action nodes** — When workflow reaches an Action node, auto-execute its tool and advance to next node without waiting for user input

### Nice to Have

- [ ] End-of-workflow handling — When workflow reaches terminal node (no outgoing edges), reset state or mark conversation as "workflow complete"

### Won't Have

- New node types beyond existing 4 (start, action, llm, condition)
- Frontend UI changes
- Variable substitution beyond existing `replaceVariables()`

## Constraints

- `conversation.metadata` field must exist in DB/entity (verify or add migration)
- Must maintain backward compatibility with conversations that have no workflow state
- Must not break simple mode or existing orchestrator behavior
- All state changes must be atomic (use transactions if needed)

## Open Questions

- Does `Conversation` entity have a `metadata` JSONB column? If not, migration needed.
