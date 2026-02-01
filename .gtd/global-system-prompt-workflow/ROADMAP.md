# Roadmap

**Spec:** ./.gtd/global-system-prompt-workflow/SPEC.md
**Goal:** Enable the use of a Global System Prompt in "Orchestrator Mode" to maintain consistent AI persona across workflow nodes.
**Created:** 2026-02-01

## Must-Haves

- [ ] **Frontend UI:** The "System Prompt" textarea in `AiResponderSettingsForm` must be visible and editable when "Orchestrator Mode" is selected.
- [ ] **Backend Context:** The `WorkflowEngineService` must accept a `globalSystemPrompt` string in its context.
- [ ] **Prompt Injection:** `WorkflowEngineService.getNodeContext` must **prepend** the Global System Prompt to the node-specific prompt.
- [ ] **Fallback:** If no node prompt exists, use Global Prompt instead of hardcoded default.

## Nice-To-Haves

- [ ] UI hint explaining that this prompt applies to all steps.

## Phases

### Phase 1: Backend Logic

**Status**: ✅ Complete
**Objective**: Update the backend `WorkflowEngineService` to accept and utilize the global system prompt during node execution.

**Features**:
- Update `WorkflowContext` interface to include optional `globalSystemPrompt`
- Update `AiResponderService` to pass the prompt to the engine
- Update `WorkflowEngineService.getNodeContext` to prepend global prompt
- Verify with tests

### Phase 2: Frontend UI

**Status**: ✅ Complete
**Objective**: Expose the System Prompt configuration field in the Orchestrator Mode UI.

**Features**:
- Move System Prompt input outside conditional rendering in `AiResponderSettingsForm`
- Add helpful description text for context
- Verify UI persistence
