---
phase: 4
created: 2026-01-25
---

# Plan: Phase 4 - Remove Dead Code

## Objective

Remove the orphaned `trigger` node type reference from `WorkflowEngineService.getNodeContext()`. This node type is referenced but has no handler in `executeStep()` and no frontend support. Keeping it is misleading and could cause silent failures.

## Context

- ./.gtd/fix-ai-workflow-audit/SPEC.md
- ./.gtd/fix-ai-workflow-audit/ROADMAP.md
- packages/backend/src/ai-responder/services/workflow-engine.service.ts (line 209)

## Architecture Constraints

- **Single Source:** N/A (code removal).
- **Invariants:** All node types referenced in `getNodeContext()` must have handlers in `executeStep()`.
- **Resilience:** N/A.
- **Testability:** N/A.

## Tasks

<task id="1" type="auto">
  <name>Remove Trigger Node Reference</name>
  <files>
    packages/backend/src/ai-responder/services/workflow-engine.service.ts
  </files>
  <action>
    1. Locate line 209 in `getNodeContext()` method.
    2. Remove `node.type === 'trigger' ||` from the conditional.
    3. The resulting condition should be:
       ```
       if (
         node.type === 'condition' ||
         node.type === 'llm'
       )
       ```
    4. Verify no other references to 'trigger' remain in the file.
  </action>
  <done>
    - Grep for 'trigger' in workflow-engine.service.ts returns only the log message at line 49 (which says "triggered", not the node type).
    - TypeScript compiles without errors.
  </done>
</task>

## Success Criteria

- [ ] No `'trigger'` node type reference exists in the conditional at line 209.
- [ ] TypeScript compiles without errors.
- [ ] The word "trigger" only appears in log messages (e.g., "Start node ${id} triggered").
