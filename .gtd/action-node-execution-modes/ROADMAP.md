# Roadmap

**Spec:** ./.gtd/action-node-execution-modes/SPEC.md
**Goal:** Enable Action nodes to support two execution modes: **LLM-driven** (where the AI determines tool arguments from conversation context) and **Static** (where pre-filled argument values are used directly).
**Created:** 2026-02-01

## Must-Haves

- [ ] **Mode Selection UI:** NodeConfigPanel displays a toggle/radio for Action nodes to choose between "Let AI decide" and "Use fixed value" modes.
- [ ] **LLM Mode Behavior:** Backend reads `data.prompt`, injects into prompt/description, LLM decides `content`.
- [ ] **Static Mode Behavior:** Backend detects `toolArgs.content`, skips LLM, executes directly.
- [ ] **Conditional UI Rendering:** Show only relevance fields (`prompt` vs `content`) based on mode.
- [ ] **Schema Update:** `ToolDataSchema` adds optional `prompt` field.
- [ ] **Backend Execution Logic:** `WorkflowEngineService.handleActionNode` implements branching logic.
- [ ] **Scope Limitation:** Only `add_visitor_note`.

## Nice-To-Haves

- [ ] Placeholder text explaining what each mode does.
- [ ] Visual indicator (icon/badge) showing which mode is active when viewing the node.

## Phases

### Phase 1: Backend Core & Schema

**Status**: ✅ Complete
**Objective**: Implement the data structure changes and backend logic to support both "LLM-Driven" and "Static" execution paths for Action nodes.

**Features:**
- Update `workflow.schemas.ts` to allow `prompt` in Action nodes.
- Refactor `WorkflowEngineService.handleActionNode` to check for `toolArgs` presence.
- Implement the "Static" path (return `nextNodeId` immediately, side effect executed).
- Implement the "LLM-Driven" path (return `requiresLlmDecision`, inject `prompt` into tool description/system prompt).
- Unit tests for both scenarios.

### Phase 2: Frontend UI & Integration

**Status**: ✅ Complete
**Objective**: Update the Workflow Editor UI to allow users to toggle between modes and configure the appropriate fields.

**Features:**
- Add "Execution Mode" toggle to `NodeConfigPanel` for Action nodes.
- Implement conditional rendering:
  - If "Static": Show `content` input (hide `prompt`).
  - If "LLM-Driven": Show `prompt` textarea (hide `content`).
- Add placeholder text (Nice-to-have).
- Verify end-to-end data saving and persistence.
- Manual verification of both flows in the running application.

### Phase 3 (Optional): Visual Polish

**Status**: ✅ Complete
**Objective**: Enhance usability with visual cues (Nice-to-haves).

**Features:**
- Add visual badge on the Node in the graph to indicate "Auto" (LLM) vs "Static".
