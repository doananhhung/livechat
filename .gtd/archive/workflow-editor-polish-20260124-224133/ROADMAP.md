# Roadmap

**Spec:** ./.gtd/workflow-editor-polish/SPEC.md
**Goal:** Complete workflow editor with Global Tools config, Condition node routing, and i18n
**Created:** 2026-01-24

## Must-Haves

- [ ] Global Tools configurable (enable + instruction per tool)
- [ ] Global Tools type change (string[] → GlobalToolConfig[])
- [ ] Condition Node UI (prompt field)
- [ ] Condition Node routing (backend LLM decision)
- [ ] Node i18n (all canvas labels translated)

## Nice-To-Haves

- [ ] Collapsible Global Tools panel

## Phases

<must-have>

### Phase 1: Global Tools Data Model & UI

**Status**: ⬜ Not Started
**Objective**: Update the globalTools type from `string[]` to `GlobalToolConfig[]` and create a new UI for configuring each tool with enable toggle + instruction field.

**Criteria covered:**

- Global Tools configurable
- Global Tools type change

---

### Phase 2: Condition Node Configuration & Routing

**Status**: ✅ Complete
**Objective**: Add prompt configuration to Condition node UI and implement backend routing logic using a `route_decision` tool call.

**Criteria covered:**

- Condition Node UI
- Condition Node routing

---

### Phase 3: Node i18n

**Status**: ✅ Complete
**Objective**: Translate all hardcoded labels in StartNode, ActionNode, LlmNode, and ConditionNode.

**Criteria covered:**

- Node i18n

</must-have>

<nice-to-have>

### Phase 4 (optional): Collapsible Global Tools Panel

**Status**: ✅ Complete
**Objective**: Add expand/collapse functionality to the Global Tools panel to save screen space.

**Criteria covered:**

- Collapsible Global Tools panel

</nice-to-have>
