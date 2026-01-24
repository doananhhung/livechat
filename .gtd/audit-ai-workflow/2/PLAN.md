---
phase: 2
created: 2026-01-25
---

# Plan: Phase 2 - Frontend Audit

## Objective

Inspect `packages/frontend/src/components/features/workflow` to verify alignment with backend expectations, identifying unused components, stale props, and configuration mismatches in the React Flow implementation.

## Context

- ./.gtd/audit-ai-workflow/SPEC.md
- ./.gtd/audit-ai-workflow/ROADMAP.md
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx

## Architecture Constraints

- **Single Source:** Node data structure in frontend must match `WorkflowNode` type expected by backend.
- **Invariants:** `ConditionNode` must generate handles compatible with backend `processRouteDecision` logic (e.g., specific handle IDs for "yes"/"no").
- **Resilience:** Editor should handle invalid or legacy node data gracefully without crashing.
- **Testability:** N/A (Audit only).

## Tasks

<task id="1" type="auto">
  <name>Audit Workflow Editor & Config Panels</name>
  <files>
    packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
    packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
    packages/frontend/src/components/features/workflow/NodeToolbar.tsx
    packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx
  </files>
  <action>
    Read the listed files.
    Check for:
    - Mismatch between `nodeTypes` defined here and backend handlers.
    - Unused props or state in `NodeConfigPanel` vs actual node data schema.
    - Hardcoded string literals that might drift from backend constants.
    - Theme integration correctness (`useThemeStore`).
    Document findings in `.gtd/audit-ai-workflow/2/AUDIT_REPORT_EDITOR.md`.
  </action>
  <done>Report created covering editor components and configuration logic.</done>
</task>

<task id="2" type="auto">
  <name>Audit Custom Node Components</name>
  <files>
    packages/frontend/src/components/features/workflow/nodes/StartNode.tsx
    packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx
    packages/frontend/src/components/features/workflow/nodes/LlmNode.tsx
    packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
  </files>
  <action>
    Read the node component files.
    Check for:
    - Handle ID generation logic (especially in `ConditionNode`) - must match backend expectation (e.g., `sourceHandle` suffixes).
    - Prop usage vs React Flow `NodeProps`.
    - Styling consistency (Tailwind classes vs theme variables).
    Document findings in `.gtd/audit-ai-workflow/2/AUDIT_REPORT_NODES.md`.
  </action>
  <done>Report created covering node logic and handle compatibility.</done>
</task>

<task id="3" type="auto">
  <name>Synthesize Frontend Findings</name>
  <files>None</files>
  <action>
    Combine findings from Task 1 & 2 into `.gtd/audit-ai-workflow/2/SUMMARY.md`.
    Classify findings into:
    - Critical (Logic/Data Mismatch)
    - Warning (Styling/Props Issues)
    - Info (Orphan/Dead Code)
  </action>
  <done>Phase 2 Summary created with categorized findings.</done>
</task>

## Success Criteria

- [ ] Completion of detailed audit report for Editor components.
- [ ] Completion of detailed audit report for Node components.
- [ ] Consolidated summary of frontend findings.
