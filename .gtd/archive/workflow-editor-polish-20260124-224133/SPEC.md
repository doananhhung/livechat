# Specification

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Complete the workflow editor with proper Global Tools configuration, working Condition node routing, and full internationalization. This addresses three remaining gaps:

1. Global Tools panel is confusing — users can't configure when each tool should be called
2. Condition (Router) node has no configuration UI and backend routing is not implemented
3. Node labels on the canvas are hardcoded in English

## Requirements

### Must Have

- [ ] **Global Tools Configurable** — Each tool has an enable toggle AND an instruction field describing when to call it
- [ ] **Global Tools Type Change** — Update `WorkflowDefinition.globalTools` from `string[]` to `GlobalToolConfig[]` with structure: `{ name: string, enabled: boolean, instruction: string }`
- [ ] **Condition Node UI** — Add configurable prompt field in NodeConfigPanel (same as LLM node)
- [ ] **Condition Node Routing** — Backend routes to Yes/No paths based on LLM decision using a dedicated `route_decision` tool or structured output
- [ ] **Node i18n** — Translate all node labels in StartNode, ActionNode, LlmNode, ConditionNode

### Nice to Have

- [ ] Collapsible Global Tools panel to save space

### Won't Have

- New tools beyond existing 3 (add_visitor_note, change_status, send_form)
- Dynamic number of condition branches (stick with Yes/No)

## Constraints

- Type change affects: `packages/shared-types`, `packages/frontend`, `packages/backend`
- Must maintain backward compatibility or migrate existing workflow configs
- Condition routing requires LLM to output a decision — use a tool call pattern (`route_decision`) for reliability
- Must use existing i18n infrastructure (`useTranslation`, en.json, vi.json)

## Open Questions

- None
