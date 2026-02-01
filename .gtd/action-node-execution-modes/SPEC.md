# Specification

**Status:** FINALIZED
**Created:** 2026-02-01

## Goal

Enable Action nodes to support two execution modes: **LLM-driven** (where the AI determines tool arguments from conversation context) and **Static** (where pre-filled argument values are used directly). This gives users explicit control over when the LLM participates in tool execution. Initial implementation targets the `add_visitor_note` tool only.

## Requirements

### Must Have

- [ ] **Mode Selection UI:** NodeConfigPanel displays a toggle/radio for Action nodes to choose between "Let AI decide" and "Use fixed value" modes.
- [ ] **LLM Mode Behavior:**
  - User provides `data.prompt` as an instruction field
  - Backend reads `data.prompt` and injects it into both the tool's `description` field AND the system prompt when calling the LLM
  - LLM analyzes the conversation history and determines the `content` argument value
  - Tool executes with LLM-determined arguments
- [ ] **Static Mode Behavior:**
  - User provides `data.toolArgs.content` as a fixed text value
  - Backend detects non-empty `toolArgs.content` and skips LLM invocation
  - Tool executes immediately with the pre-filled value
- [ ] **Conditional UI Rendering:**
  - When "Let AI decide" is selected: Show only `prompt` textarea
  - When "Use fixed value" is selected: Show only `content` input field
  - Never show both fields simultaneously
- [ ] **Schema Update:** `ToolDataSchema` in `workflow.schemas.ts` adds optional `prompt: z.string().optional()` field
- [ ] **Backend Execution Logic:** `WorkflowEngineService.handleActionNode` checks:
  - If `toolArgs.content` exists and is non-empty → Static mode (execute directly)
  - If `toolArgs` is empty or not provided → LLM mode (use `prompt` + LLM call)
- [ ] **Scope Limitation:** Only `add_visitor_note` tool supports dual modes in this phase

### Nice to Have

- [ ] Placeholder text explaining what each mode does (e.g., "Describe when and how the AI should add a note" for LLM mode)
- [ ] Visual indicator (icon/badge) showing which mode is active when viewing the node

### Won't Have

- Dual-mode support for `change_status` or `send_form` tools (future work)
- Automatic migration of existing `toolArgs.content` values to the new structure
- Ability to use both `prompt` and `toolArgs` simultaneously in a single Action node

## Constraints

- Must maintain backward compatibility: existing workflows with `toolArgs.content` continue to work (treated as Static mode)
- Changes must not affect LLM, Condition, or Switch nodes (they already use `data.prompt` correctly)
- Frontend and backend schemas must stay synchronized

## Open Questions

None.
