---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Engine Core & Toolset

## Objective

Build the backend foundation for the AI Workflow Engine. This includes defining the Workflow schema, implementing the execution engine (state machine), and adding the missing tools (`send_form`, `change_status`).

## Context

- ./.gtd/ai-workflow-engine/SPEC.md
- packages/backend/src/inbox/services/conversation.service.ts
- packages/backend/src/ai-responder/ai-responder.service.ts
- packages/backend/src/actions/actions.service.ts

## Architecture Constraints

- **Single Source:** Workflow definitions are stored in the `Project` entity (or a new `Workflow` entity if complexity warrants, but `Project.aiConfig` is the current target).
- **Invariants:** The engine must handle invalid graph states gracefully (fallback to default prompt).
- **Resilience:** Tool execution failures should be logged and reported to the chat as system messages if critical.
- **Dependency:** `send_form` relies on `ActionsService` and `change_status` relies on `ConversationService`.

## Tasks

<task id="1" type="auto">
  <name>Implement Missing Tools</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.service.ts
    packages/backend/src/ai-responder/interfaces/llm-provider.interface.ts
  </files>
  <action>
    1. Define `CHANGE_STATUS_TOOL` and `SEND_FORM_TOOL` definitions in `ai-responder.service.ts`.
    2. Inject `ConversationService` and `ActionsService` into `AiResponderService`.
    3. Update `handleVisitorMessage` tool execution loop to handle:
       - `change_status`: Call `conversationService.updateStatus`.
       - `send_form`: Call `actionsService.sendFormRequest`.
    4. Ensure `add_visitor_note` remains functional.
  </action>
  <done>
    - `AiResponderService` can execute `change_status` and `send_form` tools.
    - Tools are properly typed and validated.
  </done>
</task>

<task id="2" type="auto">
  <name>Define Workflow Schema</name>
  <files>
    packages/shared-types/src/workflow.types.ts
    packages/backend/src/projects/entities/project.entity.ts
  </files>
  <action>
    1. Create `packages/shared-types/src/workflow.types.ts`:
       - Define `WorkflowNode` (Start, LLM, Tool, Router).
       - Define `WorkflowEdge`.
       - Define `WorkflowDefinition` (nodes, edges, variables).
    2. Update `Project` entity (if needed) to ensure `aiConfig` is typed or documented to hold `WorkflowDefinition`.
  </action>
  <done>
    - TypeScript interfaces for the Workflow Graph exist.
    - Shared between frontend and backend.
  </done>
</task>

<task id="3" type="auto">
  <name>Implement Workflow Engine Logic</name>
  <files>
    packages/backend/src/ai-responder/services/workflow-engine.service.ts
    packages/backend/src/ai-responder/ai-responder.module.ts
    packages/backend/src/ai-responder/ai-responder.service.ts
  </files>
  <action>
    1. Create `WorkflowEngineService`:
       - Method `getNextStep(currentNodeId, input)`: Traverses the graph.
       - Method `executeNode(node, context)`: Handles node logic (e.g., constructs prompt for LLM node, executes tool for Tool node).
    2. Integrate into `AiResponderService`:
       - If `project.aiMode === 'orchestrator'`, load workflow from `project.aiConfig`.
       - Track `currentNodeId` in `Conversation.metadata` (or Redis).
       - Delegate execution to `WorkflowEngineService`.
  </action>
  <done>
    - `WorkflowEngineService` is implemented and injected.
    - `AiResponderService` uses the engine when a workflow is active.
    - State is persisted between turns.
  </done>
</task>

## Success Criteria

- [ ] `AiResponderService` can execute `change_status` and `send_form`.
- [ ] Workflow schema is defined in shared-types.
- [ ] Basic State Machine logic exists (can move from Start -> Next Node).
