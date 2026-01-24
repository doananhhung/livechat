---
phase: 2
created: 2026-01-25
---

# Plan: Phase 2 - Reliability & Hygiene Deep-Dive

## Objective
Perform a forensic audit of the codebase to identify orphan components, swallowed errors, and potential race conditions. This phase focuses on code quality and runtime reliability.

## Context
- ./.gtd/audit-ai-workflow/SPEC.md
- ./.gtd/audit-ai-workflow/2/RESEARCH.md
- packages/backend/src/ai-responder/
- packages/backend/src/modules/workflow/

## Architecture Constraints
- **Single Source:** Findings must be backed by code references (File:Line).
- **Invariants:** "Safe" code must handle concurrent modifications (Optimistic Locking).
- **Resilience:** Error handlers must log and alert, not just swallow.

## Tasks

<task id="1" type="auto">
  <name>Generate Code Hygiene Report</name>
  <files>
    packages/backend/src/ai-responder/**/*.ts
    packages/backend/src/modules/workflow/**/*.ts
  </files>
  <action>
    Create a report listing all analyzed files and their usage status.
    - Confirm explicitly that `VisitorLockService`, `CircuitBreaker`, and `LLMProviderManager` are wired up correctly.
    - Verify `GroqProvider` and `OpenAIProvider` registration.
    - Output to `.gtd/audit-ai-workflow/2/HYGIENE_REPORT.md`.
  </action>
  <done>HYGIENE_REPORT.md exists and confirms no critical orphans.</done>
</task>

<task id="2" type="auto">
  <name>Audit Concurrency & Reliability</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.service.ts
    packages/backend/src/modules/workflow/workflow.consumer.ts
  </files>
  <action>
    Document the race condition analysis.
    - Detail the "Safe" pattern in `WorkflowConsumer`.
    - Detail the "Unsafe" pattern in `AiResponderService` (stale save).
    - Analyze `catch` blocks in `AiResponderService` for proper logging.
    - Output to `.gtd/audit-ai-workflow/2/RELIABILITY_AUDIT.md`.
  </action>
  <done>RELIABILITY_AUDIT.md exists with code samples of safe vs unsafe patterns.</done>
</task>

## Success Criteria
- [ ] Hygiene Report confirms module wiring.
- [ ] Reliability Audit documents the `AiResponderService` race condition.
