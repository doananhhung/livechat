# Phase 1 Summary

**Status:** Complete
**Executed:** 2026-02-01

## What Was Done

Implemented backend logic to inject the Project's Global System Prompt into Workflow Decision Nodes (Action, Condition, Switch). This ensures that the global persona/instructions (e.g., "Answer in Vietnamese", "Be polite") are preserved even when the AI is performing internal routing tasks.

## Behaviour

**Before:**
- LLM Response Nodes: Used the global prompt.
- Routing Nodes (Action/Condition/Switch): Ignored the global prompt, using only node-specific instructions or a default "You are a helpful assistant" prompt. This caused persona loss during complex workflows.

**After:**
- LLM Response Nodes: Still use the global prompt.
- Routing Nodes: Now PREPEND the global prompt to their specific instructions.
  - Example: `Global Prompt + \n\n + Node Instruction`.

## Tasks Completed

1. ✓ Create Failing Test
   - Added `workflow-engine.service.spec.ts` test case to verify prompt injection.
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.spec.ts`

2. ✓ Update WorkflowContext Interface
   - Added `globalSystemPrompt` optional field to `WorkflowContext`.
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

3. ✓ Implement Prompt Injection
   - Updated `handleConditionNode`, `handleSwitchNode`, `handleActionNode` to check for and prepend `globalSystemPrompt`.
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

4. ✓ Pass Global Prompt from Service
   - Updated `AiResponderService` to pass the `project.aiResponderPrompt` (or config prompt) into the workflow context.
   - Files: `packages/backend/src/ai-responder/ai-responder.service.ts`

5. ✓ Verify Tests Pass
   - Confirmed all unit tests pass.

## Deviations

None.

## Success Criteria

- [x] Test confirms `globalSystemPrompt` is present in Condition node routing prompt.
- [x] Test confirms execution without `globalSystemPrompt` still works (backwards compat).

## Files Changed

- `packages/backend/src/ai-responder/services/workflow-engine.service.spects`
- `packages/backend/src/ai-responder/services/workflow-engine.service.ts`
- `packages/backend/src/ai-responder/ai-responder.service.ts`

## Proposed Commit Message

feat(backend): inject global system prompt into workflow routing nodes

- Update WorkflowEngine to prepend global instructions to Action/Switch/Condition prompts
- Maintain persona consistency across entire workflow execution
- Add unit tests for prompt injection
