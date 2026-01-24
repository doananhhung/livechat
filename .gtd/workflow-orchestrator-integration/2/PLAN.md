---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - State Persistence & Workflow Advancement

## Objective

Persist workflow state to conversation.metadata and advance currentNodeId after each LLM response. This enables multi-turn workflows where the AI progresses through nodes across separate messages.

## Context

- ./.gtd/workflow-orchestrator-integration/SPEC.md
- ./.gtd/workflow-orchestrator-integration/ROADMAP.md
- packages/backend/src/ai-responder/ai-responder.service.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.ts
- packages/shared-types/src/conversation.types.ts

## Architecture Constraints

- **Single Source:** `conversation.metadata.workflowState.currentNodeId` is the authoritative workflow position
- **Invariants:** `currentNodeId` must reference a valid node ID or be null (workflow complete)
- **Resilience:** Missing `workflowState` defaults to start node; invalid node ID resets workflow
- **Testability:** Repository save calls can be mocked for unit tests

## Tasks

<task id="1" type="auto">
  <name>Initialize and persist workflow state in AiResponderService</name>
  <files>
    - [MODIFY] packages/backend/src/ai-responder/ai-responder.service.ts
  </files>
  <action>
    1. Import `VisitorSessionMetadata` from `@live-chat/shared-types`
    2. In the workflow logic block (lines 131-170):
       - Cast `conversation.metadata` to `VisitorSessionMetadata` with fallback to empty object
       - If no `currentNodeId`, find start node and call `executeStep()` with a `WorkflowContext` to get the first real node
       - Store the determined `currentNodeId` for later persistence
    3. After LLM response is generated (after line 238 where message is saved):
       - Call `executeStep()` with current node to get `nextNodeId`
       - Update `conversation.metadata.workflowState.currentNodeId` to `nextNodeId`
       - Save conversation with updated metadata
    4. Use `WorkflowContext` interface correctly:
       ```typescript
       const ctx: WorkflowContext = {
         projectId: project.id,
         visitorId: conversation.visitor.id,
         conversationId: String(conversation.id),
         currentNodeId: currentNodeId,
         workflow: workflow,
         history: messages,
       };
       const result = await this.workflowEngine.executeStep(ctx);
       ```
  </action>
  <done>
    - `VisitorSessionMetadata` imported
    - `executeStep()` called with correct `WorkflowContext` signature
    - After message save, `conversation.metadata.workflowState.currentNodeId` is updated and persisted
    - TypeScript compiles without errors
  </done>
</task>

<task id="2" type="checkpoint:human-verify">
  <name>Verify workflow advances across messages</name>
  <files>
    - N/A (runtime verification)
  </files>
  <action>
    1. Start a conversation with a project that has orchestrator mode enabled with a workflow
    2. Send a message and verify the AI responds using the first LLM node's context
    3. Check database: `conversation.metadata.workflowState.currentNodeId` should be set to the next node
    4. Send another message and verify it uses the next node's context
  </action>
  <done>
    - User confirms workflow advances through nodes across messages
    - Database shows `currentNodeId` updating correctly
  </done>
</task>

## Success Criteria

- [ ] `executeStep()` called with correct `WorkflowContext` object
- [ ] `conversation.metadata.workflowState.currentNodeId` persisted after each LLM response
- [ ] Workflow advances to next node on subsequent messages
- [ ] TypeScript compiles without errors
