# Specification

**Status:** FINALIZED
**Created:** 2026-02-01

## Goal

Enable the use of a **Global System Prompt** in "Orchestrator Mode" (Advanced Workflow). This prompt acts as a consistent "Persona" or set of global instructions (e.g., tone of voice, forbidden topics) that is applied to **every node** execution in the workflow, preventing the AI from losing context when switching between nodes.

Currently, the System Prompt is only available and used in "Simple Mode". In Orchestrator Mode, it is hidden in the UI and ignored by the backend (which defaults to "You are a helpful assistant" for routing nodes).

## Requirements

### Must Have

- [ ] **Frontend UI:** The "System Prompt" textarea in `AiResponderSettingsForm` must be visible and editable when "Orchestrator Mode" is selected.
- [ ] **Backend Context:** The `WorkflowEngineService` must accept a `globalSystemPrompt` string in its context.
- [ ] **Prompt Injection:** `WorkflowEngineService.getNodeContext` must **prepend** the Global System Prompt to the node-specific prompt (if any).
  - Format expectation: `{Global Prompt}\n\n{Node Prompt}`
- [ ] **Fallback:** If no node prompt exists, use Global Prompt instead of hardcoded "You are a helpful assistant".

### Nice to Have

- [ ] UI hint explaining that this prompt applies to all steps.

### Won't Have

- We will not create a *separate* database field. We reuse `project.aiResponderPrompt`.

## Constraints

- **Consistency:** Must not break "Simple Mode" behavior (which already uses this field).
- **Architecture:** logic must reside in `WorkflowEngineService` to ensure it applies to all node types (Action, Condition, Switch).

## Open Questions

- None.
