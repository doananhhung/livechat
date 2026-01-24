---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Delete Nodes & Edges

## Objective

Enable users to delete nodes and edges from the workflow. This completes the core CRUD operations needed for a functional workflow editor.

## Context

- ./.gtd/workflow-editor-complete/SPEC.md
- ./.gtd/workflow-editor-complete/ROADMAP.md
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
- packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
- packages/frontend/src/i18n/locales/en.json
- packages/frontend/src/i18n/locales/vi.json

## Architecture Constraints

- **Single Source:** `nodes` and `edges` state in WorkflowEditor
- **Invariants:** Deleting a node must NOT leave orphan edges (React Flow handles via `onNodesChange`)
- **Resilience:** N/A — local state only
- **Testability:** Delete handlers are simple state updates

## Tasks

<task id="1" type="auto">
  <name>Add delete button to NodeConfigPanel</name>
  <files>
    - [MODIFY] packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
    - [MODIFY] packages/frontend/src/i18n/locales/en.json
    - [MODIFY] packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Add `onDelete` prop to NodeConfigPanel: `onDelete: (nodeId: string) => void`
    2. Add a destructive "Delete Node" button at bottom of panel
    3. Use i18n key: `workflow.configPanel.deleteNode`
    4. Button should call `onDelete(selectedNode.id)` and then close panel
    5. Use Button variant="destructive"
  </action>
  <done>
    - NodeConfigPanel has Delete button
    - Button uses destructive variant
    - i18n keys added for en/vi
  </done>
</task>

<task id="2" type="auto">
  <name>Wire delete handler in WorkflowEditor</name>
  <files>
    - [MODIFY] packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
  </files>
  <action>
    1. Create `handleDeleteNode` callback that:
       - Filters node from nodes state
       - Filters edges connected to that node
       - Clears selectedNodeId
    2. Pass `onDelete={handleDeleteNode}` to NodeConfigPanel
    3. Enable React Flow's built-in edge deletion:
       - Add `deleteKeyCode="Delete"` prop to enable keyboard deletion
       - React Flow's `onEdgesChange` already handles edge removal via selection + delete
  </action>
  <done>
    - Clicking delete button removes node and connected edges
    - Pressing Delete key on selected edge removes it
    - No orphan edges remain after node deletion
  </done>
</task>

## Success Criteria

- [ ] User can delete a node via button in config panel
- [ ] Connected edges are removed when node is deleted
- [ ] User can select and delete edges (via keyboard Delete key)
- [ ] i18n keys present for en/vi
