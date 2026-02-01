phase: 2
created: 2026-01-31
is_tdd: true

---

# Plan: Phase 2 - Responder Integration

## Objective
Refactor `AiResponderService` to delegate all node processing logic to `WorkflowEngineService.executeStep`, making the engine the single source of truth. This involves rewriting `_prepareWorkflow` to consume the rich `WorkflowStepResult` (implemented in Phase 1) and removing duplicated node-handling logic.

## Context
- ./.gtd/ai-responder-refactor/SPEC.md
- ./.gtd/ai-responder-refactor/ROADMAP.md
- `packages/backend/src/ai-responder/ai-responder.service.ts`
- `packages/backend/src/ai-responder/services/workflow-engine.service.ts`
- `packages/backend/src/ai-responder/ai-responder.service.spec.ts`

## Architecture Constraints
- **Single Source:** Use `WorkflowStepResult.requiresRouting`, `routingPrompt`, and `tools` from the engine. Do not reconstruct these in the service.
- **Invariants:** `_prepareWorkflow` must handle both "routing" (Condition/Switch/Action) and "generation" (LLM) states uniformly.
- **Resilience:** If the engine returns `nextNodeId: null` prematurely (workflow end), handle it gracefully.

## Tasks

<task id="1" type="auto" complexity="Medium">
  <name>Create Failing Test ensuring interface consistency</name>
  <risk>Testing private methods like `_prepareWorkflow` is fragile. We should test that `_processMessage` (public) behaves correctly when `workflowEngine` returns a routing requirement.</risk>
  <files>packages/backend/src/ai-responder/ai-responder.service.spec.ts</files>
  <action>
    Create or update `ai-responder.service.spec.ts`.
    Implement a test case: "should delegate to workflow engine and use returned routing context".
    - Mock `workflowEngine.executeStep` to return:
      ```json
      {
        "requiresRouting": true,
        "routingPrompt": "MOCKED_PROMPT",
        "tools": [{"name": "MOCKED_TOOL"}]
      }
      ```
    - Mock `llmProviderManager.generateResponse` to spy on its arguments.
    - Call `service.processMessage` with a mock payload.
    - Assert that `llmProviderManager.generateResponse` was called with `systemPrompt: "MOCKED_PROMPT"` and `tools: [{"name": "MOCKED_TOOL"}]`.
    - This proves `AiResponderService` is obeying the engine's output.
    Run the test to confirm it fails (as current implementation ignores engine output for prompt building).
  </action>
  <done>
    Test fails because `AiResponderService` currently builds its own prompts/tools internally.
  </done>
</task>

<task id="2" type="auto" complexity="Medium">
  <name>Refactor _prepareWorkflow to Delegate to Engine</name>
  <risk>This changes the core logic of the responder. Incorrect mapping of engine result to service state will break the bot.</risk>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    Modify `_prepareWorkflow` in `AiResponderService`:
    - Remove the existing `switch(currentNode.type)` block that manually constructs prompts/tools.
    - Call `this.workflowEngine.executeStep(context)`.
    - Map the result `WorkflowStepResult`:
      - If `requiresRouting`:
        - Use `result.routingPrompt` as `systemPrompt`.
        - Use `result.tools` as `tools`.
        - Set `routingNode` context.
      - Else (LLM Node):
        - Call `workflowEngine.getNodeContext` to get `systemPrompt` and `tools` (or assume `executeStep` might handle this in future, currently explicit call).
    - Ensure start node handling (initial kick-off) works by calling `executeStep`.
    Run tests to confirm pass (Green).
  </action>
  <done>
    `_prepareWorkflow` delegates to `workflowEngine.executeStep`.
    Tests pass.
  </done>
</task>

<task id="3" type="auto" complexity="Low">
  <name>Clean Up Dead Code in Responder</name>
  <risk>None, cleanup only.</risk>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    Remove any helper methods or imports in `AiResponderService` that were solely used by the old `_prepareWorkflow` logic and are no longer referenced.
  </action>
  <done>
    Codebase is clean. No unused private methods related to node handling.
  </done>
</task>

## Success Criteria
- [ ] `AiResponderService` does not contain hardcoded prompts for Condition, Switch, or Action nodes.
- [ ] Test confirms `AiResponderService` uses the prompt/tools returned by the engine (interface contract).
- [ ] Action nodes correctly prompt the LLM.
