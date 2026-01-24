---
phase: 4
created: 2026-01-24
---

# Plan: Phase 4 (optional) - End-of-Workflow Handling

## Objective

Detect when workflow reaches a terminal node (no outgoing edges) and handle it gracefully by resetting workflow state or marking conversation as complete. This prevents the workflow from getting stuck.

## Context

- ./.gtd/workflow-orchestrator-integration/SPEC.md
- ./.gtd/workflow-orchestrator-integration/ROADMAP.md
- packages/backend/src/ai-responder/ai-responder.service.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.ts

## Architecture Constraints

- **Single Source:** `workflowState.currentNodeId = null` indicates workflow is complete
- **Invariants:** A null `nextNodeId` from `executeStep()` means terminal node reached
- **Resilience:** After workflow completion, conversation continues with default AI behavior
- **Testability:** Edge detection is deterministic based on workflow definition

## Tasks

<task id="1" type="auto">
  <name>Detect terminal nodes and reset workflow state</name>
  <files>
    - [MODIFY] packages/backend/src/ai-responder/ai-responder.service.ts
  </files>
  <action>
    1. After persisting `nextNodeId`, check if it is `null`:
       - If null, the workflow has reached a terminal node
       - Log the completion: `[Workflow] Workflow completed for conversation`
    2. When `currentNodeId` is null on a subsequent message:
       - The workflow has completed, use fallback behavior
       - Either restart the workflow from start node, or use default AI prompt
    3. Add a flag to `WorkflowState` (optional enhancement):
       - `completed?: boolean` to distinguish between "not started" and "completed"
       - For now, `currentNodeId: null` can mean both (restart from start)
  </action>
  <done>
    - Terminal nodes (no outgoing edges) result in `nextNodeId: null`
    - Workflow state shows `currentNodeId: null` after completion
    - Next message either restarts workflow or uses fallback
    - TypeScript compiles without errors
  </done>
</task>

<task id="2" type="checkpoint:human-verify">
  <name>Verify end-of-workflow behavior</name>
  <files>
    - N/A (runtime verification)
  </files>
  <action>
    1. Create a workflow with a clear terminal node (node with no outgoing edges)
    2. Progress through the workflow until reaching the terminal node
    3. Verify `conversation.metadata.workflowState.currentNodeId` is null
    4. Send another message and verify workflow restarts from beginning
  </action>
  <done>
    - User confirms terminal node detection works
    - User confirms workflow restarts on next message
  </done>
</task>

## Success Criteria

- [ ] Terminal nodes result in `nextNodeId: null`
- [ ] `currentNodeId: null` triggers workflow restart on next message
- [ ] TypeScript compiles without errors
