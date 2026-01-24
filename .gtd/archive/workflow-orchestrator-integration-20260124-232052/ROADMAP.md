# Roadmap

**Spec:** ./.gtd/workflow-orchestrator-integration/SPEC.md
**Goal:** Make the AI Workflow Orchestrator fully functional with state persistence and node execution
**Created:** 2026-01-24

## Must-Haves

- [ ] LLM node handling in executeStep()
- [ ] Persist workflowState.currentNodeId to conversation.metadata
- [ ] Handle requiresRouting for Condition nodes
- [ ] Advance workflow after LLM response
- [ ] Auto-execute Action nodes when reached

## Nice-To-Haves

- [ ] End-of-workflow handling

## Phases

<must-have>

### Phase 1: Database & LLM Node Foundation

**Status**: ✅ Complete
**Objective**: Verify/add conversation.metadata column and implement LLM node handling in WorkflowEngineService.

**Criteria covered:**

- LLM node handling in executeStep()

---

### Phase 2: State Persistence & Workflow Advancement

**Status**: ✅ Complete
**Objective**: Persist workflow state to conversation.metadata and advance currentNodeId after each LLM response.

**Criteria covered:**

- Persist workflowState.currentNodeId to conversation.metadata
- Advance workflow after LLM response

---

### Phase 3: Condition Routing & Action Execution

**Status**: ✅ Complete
**Objective**: Handle requiresRouting flag with route_decision tool and auto-execute Action nodes.

**Criteria covered:**

- Handle requiresRouting for Condition nodes
- Auto-execute Action nodes when reached

</must-have>

<nice-to-have>

### Phase 4 (optional): End-of-Workflow Handling

**Status**: ✅ Complete
**Objective**: Detect terminal nodes and reset/mark workflow as complete.

**Criteria covered:**

- End-of-workflow handling

</nice-to-have>
