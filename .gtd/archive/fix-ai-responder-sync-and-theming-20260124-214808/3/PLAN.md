---
phase: 3
created: 2026-01-24
---

# Plan: Phase 3 - Inline Editor Refactor

## Objective

Remove the modal-based workflow builder and integrate the `WorkflowEditor` directly into the `AiResponderSettingsForm`. This provides a more seamless experience where the AI responder's basic configuration and its logic graph are edited and saved in a single unified form.

## Context

- ./.gtd/fix-ai-responder-sync-and-theming/SPEC.md
- packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
- packages/frontend/src/components/features/workflow/WorkflowBuilderModal.tsx

## Architecture Constraints

- **Single Source of Truth:** The form's local state (`enabled`, `prompt`, `mode`, `nodes`, `edges`, `globalTools`) is the authoritative source until submitted.
- **Testability:** `AiResponderSettingsForm` remains the main orchestrator for AI project settings.
- **Testability:** `WorkflowEditor` remains a pure-ish component that receives state and calls `onChange`.

## Tasks

<task id="1" type="auto">
  <name>Refactor AiResponderSettingsForm for Inline Editing</name>
  <files>
    packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
  </files>
  <action>
    1. Update `AiResponderSettingsForm` to manage workflow state:
       - Add state for `nodes`, `edges`, and `globalTools`.
       - Initialize these states in `useEffect` from `project.aiConfig`.
    2. Refactor the UI:
       - Remove `setIsWorkflowModalOpen` and the "Edit Workflow" button.
       - Add a container `div` (e.g., `h-[600px]`) that renders `WorkflowEditor` inline when `mode === 'orchestrator'`.
    3. Implement `handleWorkflowChange` to update the local nodes/edges/globalTools state.
    4. Update `handleSubmit`:
       - Include `aiConfig` object constructed from current workflow state.
       - Implement Start node validation (must have at least one Start node if mode is 'orchestrator').
  </action>
  <done>
    - Workflow editor appears inline when "Orchestrator" mode is selected.
    - Clicking the main "Save" button persists both basic settings and the workflow graph.
    - Saving is prevented if 'orchestrator' mode is active but the graph has no Start node.
  </done>
</task>

<task id="2" type="auto">
  <name>Final Integration and Cleanup</name>
  <files>
    packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
    packages/frontend/src/components/features/workflow/WorkflowBuilderModal.tsx
  </files>
  <action>
    1. Remove the import and usage of `WorkflowBuilderModal` in `AiResponderSettingsForm.tsx`.
    2. Delete the file `packages/frontend/src/components/features/workflow/WorkflowBuilderModal.tsx` as it is no longer used.
    3. Verify that the form correctly re-initializes when `project` prop updates (e.g., after a successful save).
  </action>
  <done>
    - `WorkflowBuilderModal.tsx` is deleted.
    - Codebase is clean of unused modal-related AI logic.
  </done>
</task>

## Success Criteria

- [ ] Users can edit the AI workflow directly within the project settings page without a modal.
- [ ] Toggling between "Simple" and "Orchestrator" modes shows/hides the editor correctly.
- [ ] A single "Save" button persists all AI configuration fields.
- [ ] No dead code remains from the previous modal-based implementation.
