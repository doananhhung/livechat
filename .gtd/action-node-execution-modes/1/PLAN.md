phase: 1
created: 2026-02-01
is_tdd: true

---

# Plan: Phase 1 - Backend Core & Schema

## Objective

Implement the dual execution modes ("LLM-Driven" vs "Static") for Action nodes in the backend. This involves updating the Zod schema to accept a new `prompt` field and modifying the `WorkflowEngineService` to branch logic based on whether static `toolArgs` are present or if the LLM should be invoked with dynamic instructions.

## Context

- ./.gtd/action-node-execution-modes/SPEC.md
- ./.gtd/action-node-execution-modes/ROADMAP.md
- packages/backend/src/ai-responder/schemas/workflow.schemas.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts

## Architecture Constraints

- **Single Source:** `node.data` determines execution strategy. `toolArgs` presence = Static; absence = LLM.
- **Invariants:** `requiresLlmDecision` must be FALSE for static execution and TRUE for LLM execution.
- **Resilience:** If tool execution fails in static mode, it should be handled gracefully (though existing error handling applies).
- **Testability:** We must test both paths (Static vs LLM) explicitly.

## Tasks

<task id="1" type="auto" complexity="Medium">
  <name>Create Failing Test (TDD)</name>
  <risk>Ensures we correctly define the expected behavior before implementing logic.</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts</files>
  <action>
    Add two new test cases to `workflow-engine.service.spec.ts`:
    1. **Static Mode:** Action node WITH `toolArgs.content`. Assert `requiresLlmDecision` is FALSE, `executeTool` IS called, and `nextNodeId` IS returned.
    2. **LLM Mode with Prompt:** Action node WITH `prompt` (and empty `toolArgs`). Assert `requiresLlmDecision` is TRUE, and `routingPrompt` contains the custom prompt text (e.g., "Extract email").
  </action>
  <done>Tests added and failing.</done>
</task>

<task id="2" type="auto" complexity="Low">
  <name>Update Workflow Schema</name>
  <risk>None</risk>
  <files>packages/backend/src/ai-responder/schemas/workflow.schemas.ts</files>
  <action>
    Update `ToolDataSchema` to include an optional `prompt` field:
    ```typescript
    export const ToolDataSchema = z.object({
      toolName: z.string().min(1, ...),
      toolArgs: z.record(z.string(), z.unknown()).optional().default({}),
      prompt: z.string().optional(), // New field
    });
    ```
  </action>
  <done>Schema accepts `prompt` in Action node data.</done>
</task>

<task id="3" type="auto" complexity="Medium">
  <name>Implement Action Node Execution Logic</name>
  <risk>Must carefully handle the branching logic and ensure tool execution happens correctly in static mode.</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    Refactor `handleActionNode`:
    1. Extract `toolArgs?.content`.
    2. **Branch 1 (Static):** If `content` is present (non-empty string):
       - Call `this.toolExecutor.executeTool(toolName, toolArgs, context)`.
       - Return `WorkflowStepResult` with `nextNodeId` and `requiresLlmDecision: false`.
    3. **Branch 2 (LLM):** If `content` is missing:
       - Retrieve `node.data.prompt`.
       - Append `prompt` to the `routingPrompt`.
       - Inject `prompt` into the `toolDef.function.description` (create a copy of `toolDef` to avoid mutating the singleton).
       - Return `WorkflowStepResult` with `requiresLlmDecision: true` (existing logic, enhanced with prompt injection).
  </action>
  <done>Service handles both execution scenarios correctly. Tests pass.</done>
</task>

## Success Criteria

- [ ] Schema validation accepts `prompt` for Action nodes.
- [ ] Static Action nodes execute immediately without LLM roundtrip.
- [ ] LLM Action nodes include the user's custom prompt in the routing instructions.
- [ ] All unit tests pass.
