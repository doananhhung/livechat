---
phase: 1
created: 2026-01-25
---

# Plan: Phase 1 - Backend Audit

## Objective

Deep dive into the `ai-responder` backend module to audit the workflow engine state machine, persistence logic, and tool execution flow. Identify any state inconsistencies, incomplete logic branches, or dead code.

## Context

- ./.gtd/audit-ai-workflow/SPEC.md
- ./.gtd/audit-ai-workflow/ROADMAP.md
- packages/backend/src/ai-responder/

## Architecture Constraints

- **Single Source:** Workflow definitions stored in Project entity. Runtime state stored in Conversation metadata.
- **Invariants:** Workflow state must always track valid node IDs. `route_decision` tool must be available when Condition node is active.
- **Resilience:** Workflow execution errors should degrade gracefully (e.g., fallback to simple AI mode).
- **Testability:** N/A (Audit only).

## Tasks

<task id="1" type="auto">
  <name>Audit Workflow Engine Service</name>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    Read `executeStep` and `processRouteDecision`. 
    Check for:
    - Missing node type handlers.
    - Potential null pointer exceptions in state transitions.
    - Logic gaps in `handleConditionNode` vs `processRouteDecision` cycle.
    - Unused internal methods or constants.
    Document findings in `.gtd/audit-ai-workflow/1/AUDIT_REPORT_ENGINE.md`.
  </action>
  <done>Report created covering execution logic and state machine integrity.</done>
</task>

<task id="2" type="auto">
  <name>Audit AI Responder Service Loop</name>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    Read `handleVisitorMessage` (lines 137-430).
    Check for:
    - `conversation.metadata.workflowState` persistence consistency (is it saved at every step?).
    - Race conditions between automated tool execution and user messages.
    - Handling of `route_decision` tool call results (is the recursive call safe?).
    - Dead code or unreachable branches in the loop logic.
    Document findings in `.gtd/audit-ai-workflow/1/AUDIT_REPORT_RESPONDER.md`.
  </action>
  <done>Report created covering persistence loop and concurrency safety.</done>
</task>

<task id="3" type="auto">
  <name>Synthesize Backend Findings</name>
  <files>None</files>
  <action>
    Combine findings from Task 1 & 2 into `.gtd/audit-ai-workflow/1/SUMMARY.md`.
    Classify findings into:
    - Critical (Logic Flaws)
    - Warning (Inconsistencies)
    - Info (Orphan/Dead Code)
  </action>
  <done>Phase 1 Summary created with categorized findings.</done>
</task>

## Success Criteria

- [ ] Completion of detailed audit report for `WorkflowEngineService`.
- [ ] Completion of detailed audit report for `AiResponderService`.
- [ ] Consolidated summary of findings categorized by severity.
