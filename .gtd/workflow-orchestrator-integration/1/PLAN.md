---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Database & LLM Node Foundation

## Objective

Extend VisitorSessionMetadata to store workflow state and add LLM node handling to WorkflowEngineService. This lays the foundation for persisting and advancing workflow state.

## Context

- ./.gtd/workflow-orchestrator-integration/SPEC.md
- ./.gtd/workflow-orchestrator-integration/ROADMAP.md
- packages/shared-types/src/conversation.types.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.ts

## Architecture Constraints

- **Single Source:** Workflow state stored in `conversation.metadata.workflowState`
- **Invariants:** `workflowState.currentNodeId` must always reference a valid node ID or be null
- **Resilience:** If workflowState is undefined, default to start node
- **Testability:** N/A for this phase (type + logic only)

## Tasks

<task id="1" type="auto">
  <name>Extend VisitorSessionMetadata with workflowState</name>
  <files>
    - [MODIFY] packages/shared-types/src/conversation.types.ts
  </files>
  <action>
    1. Add a new interface `WorkflowState`:
       ```typescript
       export interface WorkflowState {
         currentNodeId: string | null;
       }
       ```
    2. Add optional `workflowState` property to `VisitorSessionMetadata`:
       ```typescript
       workflowState?: WorkflowState;
       ```
    3. Rebuild shared-types package
  </action>
  <done>
    - WorkflowState interface exported from conversation.types.ts
    - VisitorSessionMetadata has optional workflowState property
    - `npm run build` in shared-types succeeds
  </done>
</task>

<task id="2" type="auto">
  <name>Add LLM node handling in WorkflowEngineService.executeStep()</name>
  <files>
    - [MODIFY] packages/backend/src/ai-responder/services/workflow-engine.service.ts
  </files>
  <action>
    1. Add `case 'llm':` in the switch statement of `executeStep()`
    2. For LLM nodes:
       - Return { nextNodeId: getNextNodeId(node, workflow), output: null }
       - The actual LLM call is handled by AiResponderService via getNodeContext()
       - LLM node just advances the workflow after the response is generated
    3. Ensure the method signature allows async (already is)
  </action>
  <done>
    - `case 'llm':` exists in executeStep() switch
    - LLM node returns nextNodeId from getNextNodeId()
    - TypeScript compiles without errors
  </done>
</task>

## Success Criteria

- [ ] WorkflowState interface defined in shared-types
- [ ] VisitorSessionMetadata extended with workflowState property
- [ ] LLM node handled in executeStep() with correct next node resolution
- [ ] All packages compile without errors
