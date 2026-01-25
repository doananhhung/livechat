# Specification

**Status:** FINALIZED
**Created:** 2026-01-25

## Goal

Add a new "Switch" workflow node type that enables multi-case routing (like switch-case), instead of binary yes/no (like the existing Condition node).

Users configure cases via a table (`route | when`). The LLM picks a case using a `switch_decision` tool. A default path is always present for fallback.

## Requirements

### Must Have

- [ ] New `switch` node type added to `WorkflowNode.type` union in `shared-types`
- [ ] Backend `SwitchDataSchema` in `workflow.schemas.ts` with:
  - `cases`: array of `{ route: string, when: string }` (max 10)
  - `prompt`: optional custom guidance text
- [ ] Backend `WorkflowEngineService` handles `switch` node:
  - Returns `requiresRouting: true` with multi-case prompt
  - New `processSwitchDecision()` method for routing
- [ ] New `switch_decision` tool injected when on switch node (separate from `route_decision`)
- [ ] Frontend `SwitchNode.tsx` React Flow component:
  - Table UI for `route | when` configuration
  - Default handle always visible
  - Up to 10 case handles
- [ ] Frontend `WorkflowEditor.tsx` registers `switch` in `nodeTypes`
- [ ] Frontend `NodeConfigPanel` handles switch node configuration
- [ ] i18n keys for switch node labels (en + vi)
- [ ] Zod validation for switch node data

### Nice to Have

- [ ] Drag-to-reorder cases in the table

### Won't Have

- Dynamic/unlimited cases (capped at 10)
- Nested switch nodes

## Constraints

- Must follow existing node patterns (Action, Condition, LLM)
- `route_decision` tool stays for binary condition; new `switch_decision` tool for multi-case
- System prompt must guide LLM clearly on available cases

## Open Questions

_None_
