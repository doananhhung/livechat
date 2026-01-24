# Roadmap

**Spec:** ./.gtd/workflow-editor-complete/SPEC.md
**Goal:** Make WorkflowEditor fully functional with add/delete capabilities
**Created:** 2026-01-24

## Must-Haves

- [ ] Add nodes (Start, Action, LLM, Condition)
- [ ] Delete nodes
- [ ] Delete edges
- [ ] Design system compliance
- [ ] i18n support

## Nice-To-Haves

- [ ] Condition node multiple output handles
- [ ] Keyboard shortcuts (Delete key)

## Phases

<must-have>

### Phase 1: Node Toolbar & Add Logic

**Status**: ✅ Complete
**Objective**: Add a toolbar component with buttons for each node type. Clicking adds a new node to the canvas at a calculated position.

**Criteria covered:**

- Add nodes (Start, Action, LLM, Condition)
- Design system compliance (partial)
- i18n support (partial)

---

### Phase 2: Delete Nodes & Edges

**Status**: ✅ Complete
**Objective**: Enable deletion of nodes and edges via UI controls (button in config panel, or selection + delete action).

**Criteria covered:**

- Delete nodes
- Delete edges
- Design system compliance (complete)
- i18n support (complete)

</must-have>

<nice-to-have>

### Phase 3 (optional): Keyboard Shortcuts & Condition Branching

**Status**: ✅ Complete
**Objective**: Add Delete key handler for removing selected elements. Enhance Condition node with multiple output handles.

**Criteria covered:**

- Condition node multiple output handles
- Keyboard shortcuts

</nice-to-have>
