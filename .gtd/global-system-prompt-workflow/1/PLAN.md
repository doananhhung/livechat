phase: 1
created: 2026-02-01
is_tdd: true

---

# Plan: Phase 1 - Backend Logic

## Objective

Update the `WorkflowEngineService` to inject a `globalSystemPrompt` into the routing prompts for Action, Condition, and Switch nodes. This ensures the "Global Persona" is maintained even when the AI is making internal routing decisions.

## Context

- `packages/backend/src/ai-responder/services/workflow-engine.service.ts`
- `packages/backend/src/ai-responder/ai-responder.service.ts`
- `packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts`
- `packages/backend/src/schemas/workflow.schemas.ts` (for types if needed)

## Architecture Constraints

- **Single Source:** `WorkflowContext` will carry the `globalSystemPrompt`.
- **Precedence:** Global Prompt must always appear *before* node-specific instructions.
- **Backwards Compatibility:** If `globalSystemPrompt` is undefined, behavior should remain unchanged.

## Tasks

<task id="1" type="auto" complexity="Medium">
  <name>Create Failing Test</name>
  <risk>Tests might need type casting if interfaces aren't updated yet.</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts</files>
  <action>
    1.  Add a test case `should prepend globalSystemPrompt to routing prompt for Condition node`.
    2.  Mock a `WorkflowContext` with `globalSystemPrompt: "Be polite."`.
    3.  Call `startNode` or `conditionNode`.
    4.  Expect `result.routingPrompt` to contain "Be polite.".
    5.  Run test to confirm failure (Red).
  </action>
  <done>Test fails with "Property 'globalSystemPrompt' does not exist" or assertion error.</done>
</task>

<task id="2" type="auto" complexity="Low">
  <name>Update WorkflowContext Interface</name>
  <risk>None</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    Add `globalSystemPrompt?: string;` to `WorkflowContext` interface.
  </action>
  <done>Interface updated.</done>
</task>

<task id="3" type="auto" complexity="Medium">
  <name>Implement Prompt Injection</name>
  <risk>Must verify string concatenation is clean (newlines).</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    1.  In `handleConditionNode`:
        - Prepend `context.globalSystemPrompt` to `routingPrompt`.
    2.  In `handleSwitchNode`:
        - Prepend `context.globalSystemPrompt` to `routingPrompt`.
    3.  In `handleActionNode` (LLM branch):
        - Prepend `context.globalSystemPrompt` to `routingPrompt`.
    4.  Logic: `finalPrompt = context.globalSystemPrompt ? \`\${context.globalSystemPrompt}\n\n\${routingPrompt}\` : routingPrompt;`
  </action>
  <done>Logic implemented.</done>
</task>

<task id="4" type="auto" complexity="Low">
  <name>Pass Global Prompt from Service</name>
  <risk>None</risk>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    Update `_prepareWorkflow` to pass `systemPrompt` (Project AI Config) into the `workflowCtx` object as `globalSystemPrompt`.
  </action>
  <done>Value is passed correctly.</done>
</task>

<task id="5" type="auto" complexity="Low">
  <name>Verify Tests Pass</name>
  <risk>None</risk>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts</files>
  <action>
    Run the test suite to confirm the failing test now passes (Green).
  </action>
  <done>All tests pass.</done>
</task>

## Success Criteria

- [ ] Test confirms `globalSystemPrompt` is present in Condition node routing prompt.
- [ ] Test confirms execution without `globalSystemPrompt` still works (backwards compat).
