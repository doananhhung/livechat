# Roadmap

**Spec:** ./.gtd/switch-node/SPEC.md
**Goal:** Add multi-case "Switch" node to workflow engine
**Created:** 2026-01-25

## Must-Haves

- [ ] New `switch` type in `shared-types`
- [ ] Backend `SwitchDataSchema` in `workflow.schemas.ts`
- [ ] Backend `WorkflowEngineService` handles switch node
- [ ] New `switch_decision` tool injected on switch node
- [ ] Frontend `SwitchNode.tsx` React Flow component
- [ ] Frontend `WorkflowEditor.tsx` registers switch
- [ ] Frontend `NodeConfigPanel` handles switch config
- [ ] i18n keys (en + vi)
- [ ] Zod validation for switch data

## Nice-To-Haves

- [ ] Drag-to-reorder cases in table

## Phases

### Phase 1: Types & Schema Foundation

**Status**: ✅ Complete
**Objective**: Define switch node type and Zod validation schema

Criteria:

- New `switch` type in `WorkflowNode.type` union (`shared-types`)
- `SwitchDataSchema` with `cases` array and `prompt` field
- Max 10 cases validation

---

### Phase 2: Backend Workflow Engine

**Status**: ✅ Complete
**Objective**: Integrate switch node into workflow execution

Criteria:

- `handleSwitchNode()` method returns routing prompt with all cases
- `processSwitchDecision()` routes to correct edge by case name
- `switch_decision` tool definition (case: string)
- Tool injected when LLM on switch node

---

### Phase 3: Frontend Node & Editor

**Status**: ✅ Complete
**Objective**: Visual switch node with table configuration

Criteria:

- `SwitchNode.tsx` component with dynamic handles (1 per case + default)
- Table UI: route | when (add/remove rows, max 10)
- Register in `WorkflowEditor.tsx` nodeTypes
- `NodeConfigPanel` switch-specific config form
- i18n keys in `en.json` and `vi.json`

---

### Phase 4 (optional): Polish

**Status**: ✅ Complete
**Objective**: UX improvements

Criteria:

- Drag-to-reorder cases in the table (Implemented via Up/Down buttons)
