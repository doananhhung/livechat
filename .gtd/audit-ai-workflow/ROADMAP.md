# Roadmap

**Spec:** ./.gtd/audit-ai-workflow/SPEC.md
**Goal:** Perform a forensic code audit of the AI and Workflow subsystems to create a "State of the Union" report documenting technical debt, inconsistencies, and logical gaps.
**Created:** 2026-01-25

## Must-Haves

- [ ] Map relationship between `ai-responder` and `modules/workflow`.
- [ ] Clarify "AI Responder" vs "AI Orchestrator" vs "Workflow Engine" terminology.
- [ ] Identify non-shared types or DTO inconsistencies.
- [ ] Identify orphan components (unused files).
- [ ] Identify stale methods or "dead" code paths.
- [ ] Flag empty or swallowed error handlers.
- [ ] Trace critical paths (e.g., incoming message -> AI response).
- [ ] Identify potential race conditions or state staleness.
- [ ] Verify `AiOrchestratorConfig` usage.
- [ ] Final report at `.gtd/audit-ai-workflow/REPORT.md` with citations.

## Nice-To-Haves

- [ ] Visual call graph (Mermaid/ASCII) for main AI workflow.

## Phases

<must-have>

### Phase 1: Architectural Foundation & Terminology

**Status**: ✅ Complete
**Objective**: Establish the structural ground truth of the AI/Workflow modules and resolve naming ambiguities.

- Map boundaries between `ai-responder`, `workflow`, and `orchestrator`.
- Verify if `AiOrchestratorConfig` migration is utilized.
- Audit DTO and Type sharing between Frontend and Backend.

### Phase 2: Reliability & Hygiene Deep-Dive

**Status**: ✅ Complete
**Objective**: Perform a line-by-line audit for code quality issues and unreachable logic.

- Scan for orphan components and dead code paths.
- Audit error handling (empty catch blocks).
- Identify race conditions and stale state management in the workflow engine.

### Phase 3: Critical Path Tracing & Synthesis

**Status**: ✅ Complete
**Objective**: Trace actual data flow to verify integrity and compile the final report.

- Perform deep-dive trace of the message-to-AI-response flow.
- Synthesize all findings into `REPORT.md` with precise file/line citations.

### Phase 4: Final Synthesis & Recommendation

**Status**: ✅ Complete

**Objective**: Analyze all findings from Phases 1-3 (by reading actual artifacts) and produce a comprehensive "State of the System" report.

- Read all reports generated in previous phases.
- Synthesize a master problem list (Technical Debt, Bugs, Architectural Flaws).
- Provide actionable recommendations for remediation.
  </must-have>
