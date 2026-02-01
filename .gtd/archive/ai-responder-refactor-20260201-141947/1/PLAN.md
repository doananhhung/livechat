phase: 1
created: 2026-01-31
is_tdd: true

---

# Plan: Phase 1 - Engine Logic Updates

## Objective
Update `WorkflowEngineService` to fully support the new architectural pattern where "Action" nodes are LLM-driven rather than engine-executed. Ensure `StepResult` returns rich routing context (prompts + tools) for all routing node types (Condition, Switch, Action), making the engine the single source of truth for "what to do next".

## Context
- ./.gtd/ai-responder-refactor/SPEC.md
- ./.gtd/ai-responder-refactor/ROADMAP.md
- `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

## Architecture Constraints
- **Single Source:** `WorkflowEngineService` must define the system prompt and tools for every node step.
- **Invariants:** `WorkflowStepResult` must clearly distinguish between "requires routing" (LLM needed to pick path/exec tool) and "requires generation" (LLM chat).
- **Testability:** The engine logic is pure function (mostly); unit testing should verify correct prompt construction.

## Tasks

<task id="1" type="auto" complexity="Medium">
  <name>Create Failing Test for LLM-Driven Action Node</name>
  <risk>Risk of mocking `AiToolExecutor` incorrectly. Need to ensure test focuses on `handleActionNode` output, not side effects.</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts</files>
  <action>
    Create or update `workflow-engine.service.spec.ts`.
    Implement a test case `should return routing context for Action node` that:
    - Mocks an action node config with `toolName: 'add_visitor_note'`.
    - Calls `workflowEngine.executeStep`.
    - Asserts that `result.requiresRouting` is `true`.
    - Asserts that `result.routingPrompt` contains instructions to use the tool.
    - Asserts that `result.tools` contains the specific tool definition.
    - Asserts that NO tool execution occurred (side effect check).
    Run the test to confirm it fails (Red).
  </action>
  <done>
    Test exists and fails because `handleActionNode` currently auto-executes.
  </done>
</task>

<task id="2" type="auto" complexity="Medium">
  <name>Refactor handleActionNode to be LLM-driven</name>
  <risk>Changing semantic meaning of action node from "auto-exec" to "prompt-llm". Be careful not to break type safety.</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    Modify `handleActionNode` method:
    - Remove the existing code that manually executes the tool (`toolExecutor.executeTool`).
    - Instead, return a `WorkflowStepResult` with:
      - `requiresRouting: true`
      - `routingPrompt`: A constructed system prompt instructing the LLM to use the specific tool. e.g. "You must use the tool '{toolName}'...".
      - `toolCalls`: An array containing ONLY the specific tool definition required by this action node.
    - Ensure `executeStep` allows this new return shape for 'action' type.
    Run tests to confirm they pass (Green).
  </action>
  <done>
    `handleActionNode` no longer calls `executeTool`.
    It returns logic for the LLM to do it instead.
    Tests pass.
  </done>
</task>

<task id="3" type="auto" complexity="Low">
  <name>Standardize Switch and Condition Handlers</name>
  <risk>None</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    Review and verify `handleSwitchNode` and `handleConditionNode`.
    - Ensure they are returning `WorkflowStepResult` with `requiresRouting: true`.
    - Ensure they are populating `routingPrompt`.
    - Ensure they are returning the correct `tools` (switch_decision and route_decision). *Note: Currently they rely on `getNodeContext` or internal logic; ensure `executeStep` populates the `tools` property in the result so the caller doesn't have to guess.*
    - Modify `executeStep` to attach the necessary tool definitions to the `WorkflowStepResult` for these node types if not already present.
  </action>
  <done>
    All routing handlers (Action, Switch, Condition) return uniform `WorkflowStepResult` objects containing everything the LLM needs (prompt + allowed tools).
  </done>
</task>

## Success Criteria
- [ ] `handleActionNode` returns instructions for LLM, does not execute side effects.
- [ ] `WorkflowStepResult` interface supports returning `tools` directly.
- [ ] All three routing node types return consistent StepResult shapes.
- [ ] Unit tests pass for Action node handling.
