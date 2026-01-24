---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Visual Editor (Frontend)

## Objective

Create the user interface for building workflows. This involves installing the `reactflow` (or `@xyflow/react`) library, creating the node components (Start, LLM, Tool, Router), and building the editor canvas that persists the graph to the backend via the existing `updateProject` API.

## Context

- ./.gtd/ai-workflow-engine/SPEC.md
- packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
- packages/frontend/package.json

## Architecture Constraints

- **Library:** Use `@xyflow/react` (modern React Flow).
- **Integration:** The editor lives inside `AiResponderSettingsForm` or a new dedicated tab/modal if it gets too large. Given the complexity, a dedicated route or a full-screen modal triggered from the settings form is best. For MVP, we'll embed it in a "Workflow Editor" drawer/sheet.
- **Persistence:** The entire JSON graph (`WorkflowDefinition`) is saved to `project.aiConfig`.
- **Typing:** Use the shared `WorkflowDefinition` type.

## Tasks

<task id="1" type="auto">
  <name>Install React Flow & Setup Canvas</name>
  <files>
    packages/frontend/package.json
    packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
    packages/frontend/src/components/features/workflow/nodes/StartNode.tsx
    packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx
  </files>
  <action>
    1. Install `@xyflow/react` in `packages/frontend`.
    2. Create `WorkflowEditor.tsx`:
       - Initialize React Flow canvas.
       - Implement `onNodesChange`, `onEdgesChange`, `onConnect`.
       - Define custom node types: `StartNode` (simple output), `ActionNode` (tool picker).
    3. Implement `StartNode` and `ActionNode` components using React Flow's `Handle`.
  </action>
  <done>
    - `@xyflow/react` installed.
    - Basic canvas renders with Start and Action nodes.
    - Nodes can be connected.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Advanced Nodes & Config Panel</name>
  <files>
    packages/frontend/src/components/features/workflow/nodes/LlmNode.tsx
    packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
    packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
  </files>
  <action>
    1. Create `LlmNode`:
       - Configuration for `systemPrompt`.
    2. Create `ConditionNode` (Router):
       - Configuration for branching logic (just labels for now, AI decides path).
    3. Create `NodeConfigPanel`:
       - Side panel that shows when a node is selected.
       - Allows editing node data (e.g., picking `templateId` for `send_form` tool, editing prompt for LLM).
  </action>
  <done>
    - All node types implemented.
    - Node data can be edited via side panel.
  </done>
</task>

<task id="3" type="auto">
  <name>Integrate with Project Settings</name>
  <files>
    packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
    packages/frontend/src/components/features/workflow/WorkflowBuilderModal.tsx
  </files>
  <action>
    1. Create `WorkflowBuilderModal` (or Sheet) that wraps `WorkflowEditor`.
    2. Update `AiResponderSettingsForm`:
       - Add "Edit Workflow" button (visible only when mode is 'orchestrator').
       - Pass current `aiConfig` (as `WorkflowDefinition`) to the builder.
       - Handle save: Convert React Flow state (Nodes/Edges) back to `WorkflowDefinition` structure and call `updateProject`.
  </action>
  <done>
    - User can open the editor from settings.
    - User can save the workflow.
    - Workflow persists to `project.aiConfig`.
  </done>
</task>

## Success Criteria

- [ ] React Flow installed and running.
- [ ] Users can drag/drop Start, Action, LLM, and Router nodes.
- [ ] Users can configure node properties (prompts, tools).
- [ ] The graph is successfully saved to the backend.
