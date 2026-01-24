---
phase: 3
created: 2026-01-24
---

# Plan: Phase 3 - Keyboard Shortcuts & Condition Branching

## Objective

Enhance usability with keyboard shortcuts for node deletion and add multiple output handles to ConditionNode for branching workflows. This is a "Nice to Have" phase.

## Context

- ./.gtd/workflow-editor-complete/SPEC.md
- ./.gtd/workflow-editor-complete/ROADMAP.md
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
- packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
- packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx

## Architecture Constraints

- **Single Source:** Node data (including branch labels) stored in node.data
- **Invariants:** Each handle must have a unique ID for edge connections
- **Resilience:** N/A — local state only
- **Testability:** Visual verification needed for handle positioning

## Tasks

<task id="1" type="auto">
  <name>Add multiple output handles to ConditionNode</name>
  <files>
    - [MODIFY] packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
  </files>
  <action>
    1. Add two source handles at bottom: "yes" (left) and "no" (right)
    2. Use Position.Bottom with style offsets for horizontal spacing
    3. Add unique handle IDs: `${id}-yes` and `${id}-no` (requires NodeProps for id)
    4. Add small labels under handles: "Yes" and "No"
    5. Keep existing single target handle at top
  </action>
  <done>
    - ConditionNode has 2 output handles (yes/no)
    - Handles are visually distinct with labels
    - Edges can connect to specific handles
  </done>
</task>

<task id="2" type="auto">
  <name>Add keyboard shortcut for node deletion</name>
  <files>
    - [MODIFY] packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
  </files>
  <action>
    1. Note: deleteKeyCode="Delete" was already added in Phase 2
    2. Add `selectionOnDrag={true}` to enable box selection
    3. Add `selectionMode={SelectionMode.Partial}` for easier selection
    4. Import SelectionMode from @xyflow/react
    5. This enables: select node(s) → press Delete → nodes removed
  </action>
  <done>
    - User can select node and press Delete to remove it
    - Box selection works for multiple nodes
    - Connected edges are auto-removed
  </done>
</task>

## Success Criteria

- [ ] ConditionNode has "Yes" and "No" output handles
- [ ] Edges connect to specific branch handles
- [ ] Delete key removes selected nodes
- [ ] Box selection enables multi-node operations
