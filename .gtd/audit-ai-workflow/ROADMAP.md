# Roadmap

**Spec:** ./.gtd/audit-ai-workflow/SPEC.md
**Goal:** Inspect the entire AI workflow stack (Backend → Frontend) to document inconsistencies, incomplete work, stale state mechanisms, and orphan components. The output will be a comprehensive audit report with NO code changes.
**Created:** 2026-01-25

## Must-Haves

- [ ] Backend Audit: `ai-responder` logic (State, Routing, Tool Execution)
- [ ] Frontend Audit: Workflow components & configuration
- [ ] Stale State Analysis
- [ ] Orphan Component Analysis
- [ ] End-to-End Flow Verification

## Nice-To-Haves

- [ ] Recommendations for refactoring

## Phases

<must-have>

### Phase 1: Backend Audit

**Status**: ✅ Complete
**Objective**: Deep dive into `packages/backend/src/ai-responder` to map the state machine, persistence logic, and tool execution flow. Identify potential state inconsistencies and dead code in backend services.

### Phase 2: Frontend Audit

**Status**: ✅ Complete
**Objective**: Inspect `packages/frontend/src/components/features/workflow` to verify alignment with backend expectations. Identify unused components, stale props, and configuration mismatches.

### Phase 3: Synthesis & Reporting

**Status**: ✅ Complete
**Objective**: Consolidate findings into a comprehensive Audit Report. Document all identified inconsistencies, incomplete work, stale state risks, and orphan components.

</must-have>
