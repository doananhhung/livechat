# Specification

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Make the `WorkflowEditor` component fully functional. Currently it only renders nodes/edges and allows configuration via panel. It lacks core editing capabilities: adding new nodes, deleting nodes, and deleting edges.

## Requirements

### Must Have

- [ ] **Add Nodes:** Toolbar or context menu to add all node types:
  - Start
  - Action
  - LLM
  - Condition
- [ ] **Delete Nodes:** Ability to remove selected node(s)
- [ ] **Delete Edges:** Ability to remove selected edge(s)
- [ ] **Design System Compliance:** Use semantic colors and existing UI components from `ui/`
- [ ] **i18n Support:** All user-facing strings via translation keys in `en.json` and `vi.json`

### Nice to Have

- [ ] **Condition Node Branching:** Multiple output handles for routing
- [ ] **Keyboard Shortcuts:** Delete key to remove selected elements

### Won't Have

- Drag-and-drop palette (out of scope for now)
- Complex scripting/code execution nodes

## Constraints

- Must use types from `@live-chat/shared-types` (`WorkflowNode`, `WorkflowEdge`)
- Must follow existing frontend patterns (hooks, state management)
- Must work with existing `NodeConfigPanel` integration

## Open Questions

- None
