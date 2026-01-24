---
phase: 3
created: 2026-01-24
---

# Plan: Phase 3 - Integration & Testing

## Objective

Connect the Frontend Editor to the Backend Engine. This phase ensures that the `WorkflowDefinition` created in the visual editor is correctly saved to the `Project` entity and that the `AiResponderService` correctly loads and executes this workflow during live conversations.

## Context

- ./.gtd/ai-workflow-engine/SPEC.md
- packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
- packages/backend/src/ai-responder/ai-responder.service.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.ts

## Architecture Constraints

- **Type Safety:** The frontend must output a valid `WorkflowDefinition` that matches the backend's expectation.
- **Persistence:** Saving is handled by the existing `updateProject` API; no new endpoints needed.
- **Validation:** The backend should ideally validate the workflow structure (basic check) before saving, or at least handle invalid graphs gracefully at runtime.

## Tasks

<task id="1" type="auto">
  <name>Connect Save Action</name>
  <files>
    packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
    packages/frontend/src/components/features/workflow/WorkflowBuilderModal.tsx
  </files>
  <action>
    1. Verify `AiResponderSettingsForm.tsx` correctly passes the `WorkflowDefinition` to `updateProject`.
    2. Ensure `WorkflowBuilderModal` outputs the correct structure (nodes, edges) on save.
    3. Add a basic "validation" step in frontend (e.g., ensure at least one Start node) before saving.
  </action>
  <done>
    - Saving the workflow in the UI persists it to the database.
    - Reloading the page re-populates the editor with the saved graph.
  </done>
</task>

<task id="2" type="auto">
  <name>Runtime Integration Verification</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.service.ts
    packages/backend/src/ai-responder/services/workflow-engine.service.ts
  </files>
  <action>
    1. Verify `AiResponderService` loads the workflow from `project.aiConfig`.
    2. Add logging to `WorkflowEngineService` to trace node execution (Enter Node -> Execute -> Next Node).
    3. Ensure fallback mechanism works: If workflow is invalid or missing start node, fallback to default system prompt.
  </action>
  <done>
    - Logs confirm workflow execution path.
    - Fallback logic verified by code inspection.
  </done>
</task>

## Success Criteria

- [ ] A workflow created in the frontend is saved to the DB.
- [ ] When a visitor chats, the logs show the AI loading the workflow.
- [ ] The AI follows the prompt defined in the "Start" or "LLM" node of the workflow.
