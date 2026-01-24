---
phase: 3
created: 2026-01-25
---

# Plan: Phase 3 - Critical Path Tracing & Synthesis

## Objective
Trace the end-to-end data flow for the AI Responder to confirm data integrity and compile the final "State of the Union" report.

## Context
- ./.gtd/audit-ai-workflow/SPEC.md
- ./.gtd/audit-ai-workflow/3/RESEARCH.md
- packages/backend/src/ai-responder/ai-responder.service.ts

## Architecture Constraints
- **Single Source:** `REPORT.md` will be the single artifact delivered to the user.
- **Invariants:** The report must cite specific lines for every finding.
- **Resilience:** The trace must account for failure modes (e.g. LLM timeouts).

## Tasks

<task id="1" type="auto">
  <name>Trace Critical Path</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.service.ts
  </files>
  <action>
    Document the execution flow step-by-step from event trigger to message sent.
    - Map specific lines to the logical steps (Trigger -> Fetch -> Think -> Save).
    - Explicitly flag where the lock is held and where external I/O occurs.
    - Output to `.gtd/audit-ai-workflow/3/CRITICAL_PATH.md`.
  </action>
  <done>CRITICAL_PATH.md exists with line-level tracing.</done>
</task>

<task id="2" type="auto">
  <name>Synthesize Final Report</name>
  <files>
    ./.gtd/audit-ai-workflow/1/ARCHITECTURE_MAP.md
    ./.gtd/audit-ai-workflow/1/PERSISTENCE_AUDIT.md
    ./.gtd/audit-ai-workflow/1/TYPE_AUDIT.md
    ./.gtd/audit-ai-workflow/2/HYGIENE_REPORT.md
    ./.gtd/audit-ai-workflow/2/RELIABILITY_AUDIT.md
    ./.gtd/audit-ai-workflow/3/CRITICAL_PATH.md
  </files>
  <action>
    Compile all previous findings into the final deliverable `REPORT.md`.
    - Structure: Executive Summary, Architecture, Critical Findings, Recommendations.
    - Ensure the "Stale Save" race condition is highlighted as the primary risk.
    - Ensure the "Workflow vs Status Automation" confusion is clarified.
    - Output to `.gtd/audit-ai-workflow/REPORT.md`.
  </action>
  <done>REPORT.md exists and covers all spec requirements.</done>
</task>

## Success Criteria
- [ ] Critical path is fully mapped.
- [ ] Final report is comprehensive and actionable.
