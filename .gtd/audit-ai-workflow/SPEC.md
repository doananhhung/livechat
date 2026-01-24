# Specification

**Status:** FINALIZED
**Created:** 2026-01-25

## Goal

Perform a forensic code audit of the AI and Workflow subsystems to create a "State of the Union" report. This report will serve as the ground truth for future refactoring and feature development, ensuring all technical debt, inconsistencies, and logical gaps are documented.

## Requirements

### Must Have

- **Architecture Analysis:**
  - Map the relationship between `packages/backend/src/ai-responder` and `packages/backend/src/modules/workflow`.
  - Clarify the boundaries and overlaps between "AI Responder", "AI Orchestrator" (referenced in migrations), and "Workflow Engine".
  - Identify non-shared types or DTO inconsistencies between Frontend and Backend for these features.

- **Code Hygiene Check:**
  - Identify orphan components (files with no imports/usage).
  - Identify stale methods or "dead" code paths that are unreachable.
  - Flag empty or swallowed error handlers.

- **State & Logic Verification:**
  - Trace critical paths (e.g., incoming message -> AI response) to verify data integrity.
  - Identify potential race conditions or state staleness.
  - Verify if `AiOrchestratorConfig` (migration) is actually used in the codebase.

- **Deliverable:**
  - A Markdown report located at `.gtd/audit-ai-workflow/REPORT.md`.
  - The report must cite specific files and lines for every finding.

### Nice to Have

- **Visual Graph:** A text-based representation (Mermaid or ASCII) of the call graph for the main AI workflow.

### Won't Have

- **No Code Changes:** This task is strictly read-only. No refactoring or bug fixing will be performed during this phase.

## Constraints

- **Strict Verification:** **DO NOT GUESS.** Every finding must be backed by reading the actual source code. Do not assume functionality based on function names or file paths.
- **Deep Dive:** Trace execution flows fully. Do not stop at interface definitions.
- **Scope:** Includes Backend (NestJS), Frontend (React components/settings), and Shared Types/DTOs.

## Open Questions

- (None)
